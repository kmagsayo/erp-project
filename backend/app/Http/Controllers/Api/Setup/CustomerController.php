<?php

namespace App\Http\Controllers\Api\Setup;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setup\CustomerRequest;
use App\Models\Customer;
use App\Services\Setup\CustomerService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    use HandlesSetupActions;

    public function __construct(private readonly CustomerService $service) {}

    public function index(Request $request)
    {
        $customers = $this->service->getCustomers($request);

        return ApiResponse::paginated($customers, 'customers', 'Customers retrieved successfully.');
    }

    public function store(CustomerRequest $request)
    {
        $customer = $this->service->createCustomer($request->validated());

        return ApiResponse::success(['customer' => $customer], 'Customer created successfully.', 201);
    }

    public function show(Customer $customer)
    {
        return ApiResponse::success(['customer' => $customer], 'Customer retrieved successfully.');
    }

    public function update(CustomerRequest $request, Customer $customer)
    {
        $customer = $this->service->updateCustomer($customer, $request->validated());

        return ApiResponse::success(['customer' => $customer], 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        return $this->runSetupAction(function () use ($customer) {
            $this->service->deleteCustomer($customer);

            return ApiResponse::success(null, 'Customer deleted successfully.');
        });
    }
}
