<?php

use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('oauth redirect works for supported providers', function (string $provider) {
    $response = $this->get(route('auth.redirect', ['provider' => $provider]));

    $response->assertRedirect();
    
    // Check if redirect URL contains provider-specific domain
    $targetUrl = $response->getTargetUrl();
    if ($provider === 'github') {
        expect($targetUrl)->toContain('github.com');
    } elseif ($provider === 'google') {
        expect($targetUrl)->toContain('accounts.google.com');
    }
})->with(['github', 'google']);

test('oauth callback authenticates and creates user', function (string $provider) {
    $socialiteUser = Mockery::mock(SocialiteUser::class);
    
    $socialiteUser->shouldReceive('getId')->andReturn('social-id-123');
    $socialiteUser->shouldReceive('getEmail')->andReturn('oauth@example.com');
    $socialiteUser->shouldReceive('getName')->andReturn('OAuth User');
    $socialiteUser->shouldReceive('getNickname')->andReturn('oauth_user');
    $socialiteUser->token = 'fake-token';

    Socialite::shouldReceive('driver')->with($provider)->andReturn(Mockery::mock([
        'user' => $socialiteUser
    ]));

    $response = $this->get(route('auth.callback', ['provider' => $provider]));

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticated();

    $user = User::where('email', 'oauth@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('OAuth User');
    
    $idField = "{$provider}_id";
    expect($user->$idField)->toBe('social-id-123');
    expect($user->social_token)->toBe('fake-token');
})->with(['github', 'google']);

test('oauth callback updates existing user with new social id', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'name' => 'Existing User'
    ]);

    $socialiteUser = Mockery::mock(SocialiteUser::class);
    $socialiteUser->shouldReceive('getId')->andReturn('github-id-456');
    $socialiteUser->shouldReceive('getEmail')->andReturn('existing@example.com');
    $socialiteUser->shouldReceive('getName')->andReturn('Existing User');
    $socialiteUser->token = 'new-token';

    Socialite::shouldReceive('driver')->with('github')->andReturn(Mockery::mock([
        'user' => $socialiteUser
    ]));

    $response = $this->get(route('auth.callback', ['provider' => 'github']));

    $response->assertRedirect('/dashboard');
    
    $existingUser->refresh();
    expect($existingUser->github_id)->toBe('github-id-456');
    expect($existingUser->social_token)->toBe('new-token');
});
