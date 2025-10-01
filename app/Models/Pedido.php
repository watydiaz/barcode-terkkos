<?php
namespace App\Models;

class Pedido {
    public $id;
    public $numero_pedido;
    public $nombre_cliente;
    public $estado;
    public $total_pedido;
    public $rondas;
    public $mesa_alquilada;
    public $created_at;
    public $updated_at;

    public function __construct($data) {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
}
