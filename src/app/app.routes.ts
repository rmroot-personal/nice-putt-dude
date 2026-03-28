import { Routes } from '@angular/router';
import { Welcome } from './components/welcome/welcome';
import { NewMatch } from './components/new-match/new-match';
import { PlayMatch } from './components/play-match/play-match';

export const routes: Routes = [
    {
        path: '',
        component: Welcome
    },
    {
        path: 'new-match',
        component: NewMatch
    },
    {
        path: 'play-match/:id',
        component: PlayMatch
    }
];
