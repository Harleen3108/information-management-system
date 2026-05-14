<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'record_id',
        'user_id',
        'status',
        'comments'
    ];

    public function record()
    {
        return $this->belongsTo(Record::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
