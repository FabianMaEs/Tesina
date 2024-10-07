import { Component, OnInit } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {
start: boolean = false;
  currentQuestionId: any;
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
        console.log("index: " + this.currentQuestionIndex);
        if(!this.admin) this.submitAnswer(this.currentQuestionId, this.selectedAnswer, this.roomId);
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
  if(!this.socketService.createdRoom) this.admin = true;
  else alert("Room already created");
}
  
  startQuiz(): void {
    this.socketService.startQuiz(this.roomId);
    this.start = true;
  }

  async join(): Promise<void> {
    this.socketService.joinRoom(this.roomId, () => {
      if (this.socketService.isJoinedRoom()) {
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
  // Se ejecuta cada 20 segundos
  async getJoinedUsers(): Promise<void> {
    this.joinedUsers = this.socketService.getJoinedUsers();
  }

}
