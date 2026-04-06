<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('landing page displays correctly for guests', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('auth.user', null)
    );
});

test('landing page displays correctly for authenticated users', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('auth.user.id', $user->id)
        ->where('auth.user.name', $user->name)
        ->where('auth.user.email', $user->email)
    );
});

test('common dashboard routes are accessible for authenticated users', function () {
    $user = User::factory()->create();

    $routes = [
        '/overview' => 'Overview',
        '/orchestrator' => 'Orchestrator',
        '/validation' => 'Validation',
        '/profile' => 'Profile/Edit',
    ];

    foreach ($routes as $route => $component) {
        $response = $this->actingAs($user)->get($route);
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component($component)
        );
    }
});

test('internal dashboard routes are strictly isolated and redirect guests', function () {
    $routes = [
        '/dashboard',
        '/overview',
        '/orchestrator',
        '/validation',
    ];

    foreach ($routes as $route) {
        $response = $this->get($route);
        $response->assertRedirect('/login');
    }
});
