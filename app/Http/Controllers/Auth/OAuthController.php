<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class OAuthController extends Controller
{
    /**
     * Redirect the user to the provider authentication page.
     *
     * @param string $provider
     * @return RedirectResponse
     */
    public function redirect(string $provider): RedirectResponse
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Obtain the user information from the provider.
     *
     * @param string $provider
     * @return RedirectResponse
     */
    public function callback(string $provider): RedirectResponse
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', "Unable to authenticate with {$provider}.");
        }

        $idField = "{$provider}_id";
        
        $user = User::where($idField, $socialUser->getId())
                    ->orWhere('email', $socialUser->getEmail())
                    ->first();

        if ($user) {
            $user->update([
                $idField => $socialUser->getId(),
                'social_token' => $socialUser->token,
            ]);
        } else {
            $user = User::create([
                'name' => $socialUser->getName() ?? $socialUser->getNickname(),
                'email' => $socialUser->getEmail(),
                $idField => $socialUser->getId(),
                'social_token' => $socialUser->token,
            ]);
        }

        Auth::login($user);

        return redirect()->intended('/dashboard');
    }
}
