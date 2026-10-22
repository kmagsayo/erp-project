<?php

namespace App\Services\Setup;

use App\Models\Customer;
use App\Services\Setup\Concerns\AllocatesSetupCodes;
use App\Services\Setup\Concerns\PaginatesSetupQueries;
use Illuminate\Http\Request;

class CustomerService
{
    use AllocatesSetupCodes;
    use PaginatesSetupQueries;

    public function getCustomers(Request $request)
    {
        $query = Customer::query()->orderBy('code');

        $this->applySearch($query, $request->query('search'), [
            'name',
            'code',
            'phone',
            'address',
            'tin',
            'terms_type',
        ]);
        $this->applyStatusFilter($query, $request->query('status'));

        return $this->paginateQuery($query, $request);
    }

    public function getCustomerById(int $id): Customer
    {
        return Customer::query()->findOrFail($id);
    }

    public function createCustomer(array $data): Customer
    {
        $payload = $this->preparePayload($data);
        $payload['code'] = 'CUST-TMP-'.uniqid();
        $customer = Customer::query()->create($payload);
        $customer->update(['code' => $this->nextSequentialCode('customers', 'code', 'CUST-', 3, $customer->id)]);

        return $customer->fresh();
    }

    public function updateCustomer(Customer $customer, array $data): Customer
    {
        $payload = $this->preparePayload($data, $customer);
        $customer->update($payload);

        return $customer->fresh();
    }

    public function deleteCustomer(Customer $customer): void
    {
        if ($customer->projects()->exists()) {
            throw new \RuntimeException(
                'Cannot delete this customer because it is currently being used by existing projects.',
            );
        }

        $customer->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function preparePayload(array $data, ?Customer $existing = null): array
    {
        unset($data['code'], $data['contact_person'], $data['email']);

        if (array_key_exists('phone', $data)) {
            $phone = trim((string) ($data['phone'] ?? ''));
            $data['phone'] = $phone === '' ? null : $phone;
        }

        if (array_key_exists('terms', $data) && ($data['terms'] === '' || $data['terms'] === null)) {
            $data['terms'] = null;
        }

        if (array_key_exists('terms_type', $data) && $data['terms_type'] === '') {
            $data['terms_type'] = null;
        }

        if ($existing) {
            $data['code'] = $existing->code;
        }

        return $data;
    }
}
