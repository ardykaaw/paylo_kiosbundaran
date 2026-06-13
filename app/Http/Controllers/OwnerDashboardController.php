<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;

class OwnerDashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Display owner dashboard
     */
    public function index(): Response
    {
        // Check if user is owner
        if (!auth()->user()->hasRole('Owner')) {
            abort(403, 'Unauthorized access. Owner only.');
        }

        $metrics = $this->dashboardService->getOwnerMetrics();

        return Inertia::render('owner-dashboard/index', [
            'metrics' => $metrics,
        ]);
    }
}
