<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SupportController extends Controller
{
    public function submitInquiry(Request $request)
    {
        $request->validate([
            'namespace_id' => 'required|string|max:255',
            'contact_entity' => 'required|string|max:255',
            'description' => 'required|string|min:10',
        ]);

        // In a real application, this would be saved to a database 
        // and dispatched to a job to notify the architecture team via email/slack/discord.
        Log::info("New Support Inquiry Received", [
            'user' => auth()->user()?->email ?? 'Guest',
            'namespace' => $request->namespace_id,
            'contact' => $request->contact_entity,
            'description' => $request->description,
            'timestamp' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Launch inquiry recorded in the global control log.',
            'reference_id' => 'NCC-' . strtoupper(bin2hex(random_bytes(4))),
        ]);
    }
}
