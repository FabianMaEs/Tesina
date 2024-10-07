import { Component } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {

  start: boolean = false;
  currentQuestionId: any;
  startQuizGame: boolean = false;
  startMemoramaGame: boolean = false;
  pauseTimer() {
    throw new Error('Method not implemented.');
  }
  admin: boolean = false;
  questions: any[] = [];
  puntaje: number = 0;
  roomId: number = 1;
  joinedUsers: number = 0;
  currentQuestionIndex: number = 0;
  currentQuestion: any = null;
  timeLeft: number = 6;
  ingresar: boolean = false;
  iniciado: boolean = false;
  mostrarQuiz: boolean = false;
  selectedAnswer: number = -1;
  constructor(private socketService: SocketService) {
  }

  ngOnInit(): void {
    this.socketService.onUserCountUpdate((joinedUsers: number) => {
      this.joinedUsers = joinedUsers;
    });

    // Escuchar eventos para manejar el temporizador
    this.socketService.onQuizTimerUpdate((timeLeft: number) => {
      this.timeLeft = timeLeft;
      if (!this.iniciado)
        this.iniciado = true;
      // Pasar a la siguiente pregunta si el tiempo se acaba
      if (timeLeft === 0) {
        this.currentQuestionIndex++;
        console.log("onQuizTimerUpdate.id:", this.currentQuestionId);        
        this.submitAnswer(this.currentQuestionId, this.selectedAnswer, this.roomId);
      }
    });

    this.socketService.onNextQuestion((questionIndex: number) => {
      this.currentQuestionIndex = questionIndex;
      this.loadCurrentQuestion();
    });

    this.iniciado = this.socketService.iniciado;
    console.log('Iniciado:', this.iniciado);
  }

  selectOption(option: number): void {
    console.log('Selected option:', option);
    this.selectedAnswer = option;
  }

async createRoom(): Promise<void> {
  this.socketService.createRoom(this.roomId, (roomId: number) => {
    console.log('Room ID:', roomId);
    this.roomId = roomId;
    this.socketService.roomId = roomId;
    // No iniciar el temporizador aquí, se inicia en el servidor cuando el admin decide empezar el quiz
  });
  if(!this.socketService.createdRoom) {
    this.admin = true;
    this.socketService.user = "admin";
  }
  else alert("Room already created");
}
  
  startQuiz(): void {
    this.socketService.startQuiz(this.roomId);
    this.startQuizGame = true;
  }

  startMemorama(): void {
    this.socketService.startMemorama(this.roomId);
    this.startMemoramaGame = true;
  }

  async join(): Promise<void> {
    this.socketService.joinRoom(this.roomId, () => {
      if (this.socketService.isJoinedRoom()) {
        console.log('Joining quiz in QuizComponent');
        this.socketService.roomId = this.roomId;
        this.socketService.joinQuiz();
        this.socketService.onQuizQuestions((questions) => {
          this.questions = questions;
          this.loadCurrentQuestion();
        });
        this.socketService.onAnswerResult((result) => {
          console.log('Answer result:', result);
          if (result.success) {
            if (result.correct) {
              this.puntaje++;
              //alert('Respuesta correcta');
            } else {
              //alert('Respuesta incorrecta');
            }
          } else {
            console.error('Error receiving answer result');
          }
        });
      }
    });
    this.admin = false;
    this.ingresar = true;
    console.log('Joining room:', this.roomId);
  }

  submitAnswer(questionId: string, selectedOptionIndex: number, roomId: number): void {
    const selectedOption = this.currentQuestion.options[selectedOptionIndex];
    this.socketService.submitAnswer({
      questionId, 
      selectedOption, 
      roomId
    });
  }

  shuffleOptions(options: any[]): any[] {
    return options.sort(() => Math.random() - 0.5);
  }

  loadCurrentQuestion(): void {
    if (this.questions.length > 0 && this.currentQuestionIndex < this.questions.length) {
      console.log('Preguntas recuperadas:', this.questions);

      this.currentQuestion = {
        ...this.questions[this.currentQuestionIndex],
        options: this.shuffleOptions([...this.questions[this.currentQuestionIndex].options])
      };
      this.currentQuestionId = this.currentQuestion._id;
    } else {
      this.currentQuestion = null; // No hay más preguntas
      
    }
  }

  // Funcion que obtiene el numero de personas que se han unido a la sala cada 20 segundos
  // Se ejecuta cada 20 segundos?
  async getJoinedUsers(): Promise<void> {
    this.joinedUsers = this.socketService.getJoinedUsers();
  }

}
