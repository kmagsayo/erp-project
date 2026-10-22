<?php

namespace App\Console\Commands;

use Database\Seeders\ImportRtsSystemSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ImportRtsSqlCommand extends Command
{
    protected $signature = 'rts:import {path : Path to the rts_system.sql file}';

    protected $description = 'Load setup records from an rts_system MySQL dump into the local database';

    public function handle(): int
    {
        $path = $this->argument('path');

        if (! is_file($path)) {
            $this->error("SQL file not found: {$path}");

            return self::FAILURE;
        }

        $sql = file_get_contents($path);
        if ($sql === false || $sql === '') {
            $this->error('The SQL file is empty.');

            return self::FAILURE;
        }

        $inserts = $this->extractInserts($sql);
        foreach ($this->extractSetupColumns($sql) as $table => $columns) {
            if (! isset($inserts[$table])) {
                $inserts[$table] = [
                    'columns' => $columns,
                    'rows' => [],
                ];
            }
        }

        if ($inserts === []) {
            $this->error('No setup data was found in that SQL file.');

            return self::FAILURE;
        }

        Schema::disableForeignKeyConstraints();

        try {
            foreach ($inserts as $table => $insert) {
                Schema::dropIfExists($table);
                $columns = $insert['columns'];
                Schema::create($table, function ($blueprint) use ($columns) {
                    foreach ($columns as $column) {
                        $blueprint->text($column)->nullable();
                    }
                });

                foreach (array_chunk($insert['rows'], 50) as $chunk) {
                    DB::table($table)->insert(array_map(
                        fn (array $row) => array_combine($columns, $row),
                        $chunk,
                    ));
                }

                $this->line($table.': '.count($insert['rows']).' rows');
            }

            $this->call('db:seed', [
                '--class' => ImportRtsSystemSeeder::class,
                '--force' => true,
            ]);
        } finally {
            foreach (array_keys($inserts) as $table) {
                Schema::dropIfExists($table);
            }
            Schema::enableForeignKeyConstraints();
        }

        Storage::disk('public')->deleteDirectory('setups/companies/logos');

        $this->info('Imported the RTS setup data into the local database.');

        return self::SUCCESS;
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function extractSetupColumns(string $sql): array
    {
        $tables = [];

        if (! preg_match_all(
            '/CREATE TABLE `([a-z0-9_]+)` \((.*?)\) ENGINE=/s',
            $sql,
            $matches,
            PREG_SET_ORDER,
        )) {
            return $tables;
        }

        foreach ($matches as $match) {
            if (! str_starts_with($match[1], 'setup_')) {
                continue;
            }

            preg_match_all('/`([a-z0-9_]+)`/i', $match[2], $columns);
            $tables[$match[1]] = array_values(array_unique($columns[1]));
        }

        return $tables;
    }

    /**
     * @return array<string, array{columns: array<int, string>, rows: array<int, array<int, string|null>>}>
     */
    private function extractInserts(string $sql): array
    {
        $tables = [];
        $offset = 0;
        $length = strlen($sql);

        while ($offset < $length) {
            $position = stripos($sql, 'insert', $offset);
            if ($position === false) {
                break;
            }

            if (! preg_match(
                '/insert\s+into\s+`([a-z0-9_]+)`\s*\(([^)]+)\)\s*values\s*/i',
                $sql,
                $matches,
                PREG_OFFSET_CAPTURE,
                $position,
            )) {
                $offset = $position + 6;
                continue;
            }

            $table = $matches[1][0];
            $valueStart = $matches[0][1] + strlen($matches[0][0]);
            [$rows, $offset] = $this->parseTuples($sql, $valueStart);

            if (! str_starts_with($table, 'setup_')) {
                continue;
            }

            $columns = array_map(
                fn (string $column) => trim($column, " `\t\r\n"),
                explode(',', $matches[2][0]),
            );
            $tables[$table] = [
                'columns' => $columns,
                'rows' => $rows,
            ];
        }

        return $tables;
    }

    /**
     * @return array{0: array<int, array<int, string|null>>, 1: int}
     */
    private function parseTuples(string $sql, int $offset): array
    {
        $rows = [];
        $length = strlen($sql);

        while ($offset < $length) {
            while ($offset < $length && str_contains(" \r\n\t,", $sql[$offset])) {
                $offset++;
            }

            if ($offset >= $length || $sql[$offset] === ';') {
                return [$rows, $offset + 1];
            }

            if ($sql[$offset] !== '(') {
                return [$rows, $offset];
            }

            $offset++;
            $values = [];

            while ($offset < $length) {
                while ($offset < $length && str_contains(" \r\n\t", $sql[$offset])) {
                    $offset++;
                }

                if ($sql[$offset] === ')') {
                    $offset++;
                    break;
                }

                [$value, $offset] = $this->parseValue($sql, $offset);
                $values[] = $value;

                while ($offset < $length && str_contains(" \r\n\t", $sql[$offset])) {
                    $offset++;
                }

                if ($offset < $length && $sql[$offset] === ',') {
                    $offset++;
                }
            }

            $rows[] = $values;
        }

        return [$rows, $offset];
    }

    /**
     * @return array{0: string|null, 1: int}
     */
    private function parseValue(string $sql, int $offset): array
    {
        if ($sql[$offset] === "'") {
            $offset++;
            $value = '';
            $length = strlen($sql);

            while ($offset < $length) {
                $character = $sql[$offset];
                if ($character === '\\' && $offset + 1 < $length) {
                    $next = $sql[$offset + 1];
                    $value .= match ($next) {
                        'n' => "\n",
                        'r' => "\r",
                        't' => "\t",
                        default => $next,
                    };
                    $offset += 2;
                    continue;
                }

                if ($character === "'") {
                    if ($offset + 1 < $length && $sql[$offset + 1] === "'") {
                        $value .= "'";
                        $offset += 2;
                        continue;
                    }

                    return [$value, $offset + 1];
                }

                $value .= $character;
                $offset++;
            }

            return [$value, $offset];
        }

        if (stripos($sql, 'NULL', $offset) === $offset) {
            return [null, $offset + 4];
        }

        $length = strlen($sql);
        $start = $offset;
        while ($offset < $length && ! str_contains(",)", $sql[$offset])) {
            $offset++;
        }

        return [trim(substr($sql, $start, $offset - $start)), $offset];
    }
}
