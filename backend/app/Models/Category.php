<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'allowed_extensions'];

    /**
     * Returns allowed extensions as a clean array, e.g. ['pdf', 'docx'].
     */
    public function getAllowedExtensionsArrayAttribute(): array
    {
        if (empty($this->allowed_extensions)) return [];
        return array_filter(array_map(
            fn($e) => strtolower(ltrim(trim($e), '.')),
            explode(',', $this->allowed_extensions)
        ));
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($category) {
            $category->slug = Str::slug($category->name);
        });
    }

    public function records()
    {
        return $this->hasMany(Record::class);
    }
}
