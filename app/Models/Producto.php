<?php
namespace App\Models;

class Producto {
    public $id;
    public $codigo;
    public $nombre;
    public $precio_venta;
    public $stock_actual;
    public $unidad_medida;
    public $activo;

    public function __construct($data) {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
}
