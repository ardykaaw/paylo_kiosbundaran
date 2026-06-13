<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AttendanceController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:attendances.view', only: ['index', 'statistics']),
            new Middleware('permission:attendances.edit', only: ['clockIn', 'clockOut', 'requestLeave']),
        ];
    }
    /**
     * Display attendance dashboard
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');
        $perPage = $request->get('per_page', 10);

        $user = auth()->user();
        $isOwner = $user->hasRole('Owner');

        $query = Attendance::where('tenant_id', $user->tenant_id)
            ->with(['user', 'branch'])
            ->orderBy('date', 'desc')
            ->orderBy('check_in_time', 'desc');

        // Non-owner users can only see their own attendance
        if (!$isOwner) {
            $query->where('user_id', $user->id);
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }

        $attendances = $query->paginate($perPage);
        $todayAttendance = Attendance::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('date', today())
            ->first();

        return Inertia::render('attendance/index', [
            'attendances' => $attendances,
            'todayAttendance' => $todayAttendance,
            'isOwner' => $isOwner,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Clock in
     */
    public function clockIn(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();
        $today = today();

        // Check if already clocked in today
        $existingAttendance = Attendance::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existingAttendance) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Already clocked in today.']);
            return back();
        }

        $now = now();
        $branchId = $user->branch_id;

        // Determine status based on clock in time
        // Assuming work starts at 9:00 AM
        $workStartTime = $now->copy()->setHour(9)->setMinute(0)->setSecond(0);
        $status = $now->gt($workStartTime) ? 'late' : 'present';

        Attendance::create([
            'tenant_id' => $user->tenant_id,
            'branch_id' => $branchId,
            'user_id' => $user->id,
            'date' => $today,
            'check_in_time' => $now,
            'check_out_time' => null,
            'status' => $status,
            'notes' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clocked in successfully.']);

        return back();
    }

    /**
     * Clock out
     */
    public function clockOut(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();
        $today = today();

        $attendance = Attendance::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$attendance) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'No attendance record found for today.']);
            return back();
        }

        if ($attendance->check_out_time) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Already clocked out today.']);
            return back();
        }

        $attendance->update([
            'check_out_time' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Clocked out successfully.']);

        return back();
    }

    /**
     * Request leave/sick
     */
    public function requestLeave(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', 'in:permission,sick'],
            'notes' => ['nullable', 'string'],
        ]);

        $user = auth()->user();

        // Check if attendance already exists for this date
        $existingAttendance = Attendance::where('tenant_id', $user->tenant_id)
            ->where('user_id', $user->id)
            ->where('date', $validated['date'])
            ->first();

        if ($existingAttendance) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Attendance record already exists for this date.']);
            return back();
        }

        Attendance::create([
            'tenant_id' => $user->tenant_id,
            'branch_id' => $user->branch_id,
            'user_id' => $user->id,
            'date' => $validated['date'],
            'check_in_time' => null,
            'check_out_time' => null,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave request submitted successfully.']);

        return back();
    }

    /**
     * Get attendance statistics
     */
    public function statistics(Request $request): Response
    {
        $user = auth()->user();
        $isOwner = $user->hasRole('Owner');

        $query = Attendance::where('tenant_id', $user->tenant_id);

        if (!$isOwner) {
            $query->where('user_id', $user->id);
        }

        $totalAttendances = $query->count();
        $presentCount = (clone $query)->where('status', 'present')->count();
        $lateCount = (clone $query)->where('status', 'late')->count();
        $permissionCount = (clone $query)->where('status', 'permission')->count();
        $sickCount = (clone $query)->where('status', 'sick')->count();

        return Inertia::render('attendance/statistics', [
            'statistics' => [
                'total' => $totalAttendances,
                'present' => $presentCount,
                'late' => $lateCount,
                'permission' => $permissionCount,
                'sick' => $sickCount,
            ],
            'isOwner' => $isOwner,
        ]);
    }
}
