<?php
namespace App\Models;

class Pago {
    public $id;
    public $pedido_id;
    public $monto;
    public $metodo_pago;
    public $fecha;
    public $notas;

    public function __construct($data) {
        foreach ($data as $key => $value) {
            $this->$key = $value;
        }
    }
}
