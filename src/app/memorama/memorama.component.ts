import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-memorama',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './memorama.component.html',
  styleUrl: './memorama.component.css'
})
export class MemoramaComponent implements OnInit {
  tarjetas: { imgSrc: string, text: string, flipped: boolean, isMatched: boolean }[] = [];
  selecciones: number[] = [];
  roomId: number;
  tiempo: any;
  movimientos: any;

  constructor(private socketService: SocketService) {
    this.roomId = this.socketService.roomId;
    this.movimientos = 0;
    this.tiempo = 0;
    // Contador de tiempo
    setInterval(() => {
      this.tiempo++;
    }, 1000);
  }

  ngOnInit(): void {
    this.generarTablero();
  }

  cargarIconos() {
    return [
      { img: 'assets/memorama/ducha.png', text: 'Bañarse en 5 minutos' },
      { img: 'assets/memorama/cepillado.png', text: 'Cerrar el grifo mientras te cepillas' },
      { img: 'assets/memorama/basura.png', text: 'No tirar basura al agua' },
      { img: 'assets/memorama/detergente.webp', text: 'Usa detergente biodegradable' },
      { img: 'assets/memorama/gotera.jpg', text: 'Repara las goteras' },
      { img: 'assets/memorama/lavado_auto.png', text: 'Lava tu auto con cubeta' },
      { img: 'assets/memorama/regado_plantas.png', text: 'Riega tus plantas por la noche' },
      
    ];
  }

  generarTablero() {
    const iconos = this.cargarIconos();
    this.tarjetas = [];

    iconos.forEach((icono) => {
      // Crear dos tarjetas, una para la imagen y otra para el texto
      this.tarjetas.push({ imgSrc: icono.img, text: '', flipped: false, isMatched: false });
      this.tarjetas.push({ imgSrc: '', text: icono.text, flipped: false, isMatched: false });
    });

    // Barajar las tarjetas
    this.tarjetas = this.tarjetas.sort(() => Math.random() - 0.5);
  }

  seleccionarTarjeta(index: number) {
    const tarjeta = this.tarjetas[index];

    // Ignorar si la tarjeta ya está volteada o emparejada
    if (tarjeta.flipped || tarjeta.isMatched) return;

    tarjeta.flipped = true;
    this.selecciones.push(index);

    if (this.selecciones.length === 2) {
      this.verificarEmparejamiento();
      this.movimientos++;
    }
  }

  verificarEmparejamiento() {
    const [index1, index2] = this.selecciones;
    const tarjeta1 = this.tarjetas[index1];
    const tarjeta2 = this.tarjetas[index2];

    // Verificar si el par coincide (una es imagen y la otra el texto relacionado)
    if ((tarjeta1.imgSrc && tarjeta2.text && tarjeta2.text === this.obtenerTextoRelacionado(tarjeta1.imgSrc)) ||
        (tarjeta2.imgSrc && tarjeta1.text && tarjeta1.text === this.obtenerTextoRelacionado(tarjeta2.imgSrc))) {
      
      tarjeta1.isMatched = true;
      tarjeta2.isMatched = true;
      this.verificarSiJuegoTerminado();
    } else {
      setTimeout(() => {
        tarjeta1.flipped = false;
        tarjeta2.flipped = false;
      }, 1000);
    }

    this.selecciones = [];
  }

  obtenerTextoRelacionado(imgSrc: string): string {
    const icono = this.cargarIconos().find(icon => icon.img === imgSrc);
    return icono ? icono.text : '';
  }

  verificarSiJuegoTerminado() {
    if (this.tarjetas.every(tarjeta => tarjeta.isMatched)) {
      alert('¡Felicidades! Has terminado el juego...' + '\n' + 'Tiempo: ' + this.tiempo + ' segundos' + '\n' + 'Movimientos: ' + this.movimientos);
    }
  }
}
