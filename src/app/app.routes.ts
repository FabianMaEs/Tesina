import { Routes } from '@angular/router';
import { QuizComponent } from './quiz/quiz.component';
import { MemoramaComponent } from './memorama/memorama.component';
import { MenuComponent } from './menu/menu.component';

// Exportar las rutas de la aplicación
export const routes: Routes = [
    { path: 'menu', component: MenuComponent },
    { path: 'quiz', component: QuizComponent },
    { path: 'memorama', component: MemoramaComponent }
];
