export interface IMatch {
    id: string;
    name: string;
    createdByUserId: string;
    createdAt: string;
    players: Array<string>;
    golfCourseId: string;
}