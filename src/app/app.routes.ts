import { Routes } from '@angular/router';
import { Welcome } from './components/welcome/welcome';
import { NewMatch } from './components/new-match/new-match';
import { PlayMatch } from './components/play-match/play-match';
import { MyMatches } from './components/my-matches/my-matches';
import { CreateAccount } from './components/create-account/create-account';
import { ManageProfile } from './components/manage-profile/manage-profile';
import { Login } from './components/login/login';
import { UserLockerRoom } from './components/user-locker-room/user-locker-room';
import { CreateGolfCourse } from './components/create-golf-course/create-golf-course';
import { Scorecard } from './components/scorecard/scorecard';

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
    },
    {
        path: 'my-matches',
        component: MyMatches
    },
    {
        path: 'create-account',
        component: CreateAccount
    },
    {
        path: 'manage-profile',
        component: ManageProfile
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'locker-room',
        component: UserLockerRoom
    },
    {
        path: 'create-golf-course',
        component: CreateGolfCourse
    },
    {
        path: 'scorecard/:id',
        component: Scorecard
    }
];
