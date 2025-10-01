<?php
namespace App\Models;

class Ronda {
    public $id;
    public $pedido_id;
    public $numero_ronda;
    public $total;
    public $estado;
    public $productos;
    public $created_at;
    public $updated_at;

    public function __construct($data) {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
}
