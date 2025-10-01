<?php
namespace App\Models;

class Mesa {
    public $id;
    public $numero_mesa;
    public $capacidad;
    public $precio_hora;
    public $activa;

    public function __construct($data) {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
}
