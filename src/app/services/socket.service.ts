// Servicio de Socket
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  createdRoom: boolean = false;
  joinedRoom: boolean = false;
  puntaje: number = 0;
  iniciado: boolean = false;
  roomId: number = -1;
  user: string = "player";

  constructor(private router: Router) {
    this.socket = io('http://localhost:4000');
    this.socket.on('connection', () => {
      console.log('Connected to server');
    });
  }

  // Room

  createRoom(roomId: number, callback: (roomId: number) => void) {
    console.log('Creating room:', roomId);
    this.socket.emit('createRoom', roomId);
    this.socket.once('roomCreated', (roomId: number) => {
      console.log('Room created:', roomId);
      callback(roomId);
      this.createdRoom = true;
    });
    this.socket.once('error', (error: string) => {
      console.log('Error:', error);
      this.createdRoom = false;
    });
  }
  
  joinRoom(roomId: number, callback: () => void) {
    this.socket.emit('joinRoom', roomId);
    this.socket.once('UserJoined', (data: { roomId: number, joinedUsers: number }) => {
      console.log('Room joined:', data.roomId);
      this.joinedRoom = true;
      callback();
    });
  }  

  onUserCountUpdate(callback: (joinedUsers: number) => void): void {
    this.socket.on('UserJoined', (data: { joinedUsers: number }) => {
      callback(data.joinedUsers);
    });

    this.socket.on('UserLeft', (data: { joinedUsers: number }) => {
      callback(data.joinedUsers);
    });
  }

  getJoinedUsers(): number {
    let joinedUsers: number = 0;
    this.socket.on('UserJoined', (data: { joinedUsers: number }) => {
      joinedUsers = data.joinedUsers;
    });
    return joinedUsers;
  }

  isJoinedRoom(): boolean {
    return this.joinedRoom;
  }


  // Quiz

  joinQuiz(): void {
    if (this.joinedRoom) {
      this.socket.emit('joinQuiz');
    } else {
      console.log('Cannot join quiz, not part of a team');
    }
  }

  startQuiz(roomId: number): void {
    console.log('Starting quiz:', roomId);
    this.socket.emit('startQuiz', roomId);
    console.log('Jugador:', this.user);
  }

  onQuizStarted(callback: () => void): void {
    this.socket.on('quizStarted', () => {
      this.iniciado = false;
      console.log('Quiz started');
      callback();
    });
  }

  onQuizTimerUpdate(callback: (timeLeft: number) => void): void {
    this.socket.on('quizTimerUpdate', (timeLeft: number) => {
      callback(timeLeft);
    });
  }
  
  onNextQuestion(callback: (questionIndex: number) => void): void {
    this.socket.on('nextQuestion', (questionIndex: number) => {
      callback(questionIndex);
    });
  }
  

  onQuizQuestions(callback: (questions: any) => void): void {
    this.socket.on('quizQuestions', (questions: any) => {
      console.log('Received questions from server:', questions);
      callback(questions);
    });
  }

  onAnswerResult(callback: (data: any) => void): void {
    this.socket.on('answerResult', (data: any) => {
      //console.log('Received answerResult:', data);
      callback(data);
    });
  }
  
  submitAnswer(answerData: any) {
    //console.log('Submitting answer:', answerData);
    this.socket.emit('submitAnswer', answerData);
  }

  // Memorama

  startMemorama(roomId: number): void {
    console.log('Starting Memorama:', roomId);
    this.socket.emit('startMemorama', roomId);
  }

  onMemoramaStarted(callback: () => void): void {
    this.socket.on('memoramaStarted', () => {
      console.log('Memorama started');
      callback();
    });
  }
}