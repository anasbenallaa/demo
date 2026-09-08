<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('a user can upload an avatar to the s3 disk', function () {
    Storage::fake('s3');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('profile.avatar.update'), [
            'avatar' => UploadedFile::fake()->image('me.jpg', 256, 256),
        ])
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->avatar_path)->toStartWith('settings/profile/avatar/');
    Storage::disk('s3')->assertExists($user->avatar_path);
    expect($user->avatar)->toContain($user->avatar_path);
});

test('uploading a new avatar replaces and deletes the previous one', function () {
    Storage::fake('s3');

    $user = User::factory()->create(['avatar_path' => 'settings/profile/avatar/old.jpg']);
    Storage::disk('s3')->put('settings/profile/avatar/old.jpg', 'old');

    $this->actingAs($user)
        ->post(route('profile.avatar.update'), [
            'avatar' => UploadedFile::fake()->image('new.png', 256, 256),
        ]);

    Storage::disk('s3')->assertMissing('settings/profile/avatar/old.jpg');
    Storage::disk('s3')->assertExists($user->refresh()->avatar_path);
});

test('an avatar larger than 1MB is rejected', function () {
    Storage::fake('s3');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('profile.avatar.update'), [
            'avatar' => UploadedFile::fake()->image('huge.jpg')->size(1025),
        ])
        ->assertSessionHasErrors('avatar');

    expect($user->refresh()->avatar_path)->toBeNull();
});

test('non-image and disallowed types are rejected', function () {
    Storage::fake('s3');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('profile.avatar.update'), [
            'avatar' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('avatar');
});

test('a user can remove their avatar', function () {
    Storage::fake('s3');

    $user = User::factory()->create(['avatar_path' => 'settings/profile/avatar/x.jpg']);
    Storage::disk('s3')->put('settings/profile/avatar/x.jpg', 'data');

    $this->actingAs($user)
        ->delete(route('profile.avatar.destroy'))
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->avatar_path)->toBeNull();
    Storage::disk('s3')->assertMissing('settings/profile/avatar/x.jpg');
});

test('guests cannot upload an avatar', function () {
    $this->post(route('profile.avatar.update'), [
        'avatar' => UploadedFile::fake()->image('me.jpg'),
    ])->assertRedirect(route('login'));
});
