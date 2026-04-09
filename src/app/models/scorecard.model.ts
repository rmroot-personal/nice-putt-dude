import { GolfHole, IGolfCourse } from "./golf-course.model";

export interface IScorecard {
    id: string;
    userId: string;
    courseId: string;
    matchId: string;
    date: Date;
    holes: EighteenHoles;
}

export interface ScorecardHole extends GolfHole {
    strokes: number;
}

export interface EighteenHoles {
    hole1: ScorecardHole,
    hole2: ScorecardHole,
    hole3: ScorecardHole,
    hole4: ScorecardHole,
    hole5: ScorecardHole,
    hole6: ScorecardHole,
    hole7: ScorecardHole,
    hole8: ScorecardHole,
    hole9: ScorecardHole,
    hole10: ScorecardHole,
    hole11: ScorecardHole,
    hole12: ScorecardHole,
    hole13: ScorecardHole,
    hole14: ScorecardHole,
    hole15: ScorecardHole,
    hole16: ScorecardHole,
    hole17: ScorecardHole,
    hole18: ScorecardHole,
}

export function getEighteenHolesFromCourse(golfCourse: IGolfCourse): EighteenHoles {
    const scorecardHoles: EighteenHoles = {
        hole1: { 
            par: golfCourse.holes.hole1.par,
            strokes: golfCourse.holes.hole1.par
        },
        hole2: {
            par: golfCourse.holes.hole2.par,
            strokes: golfCourse.holes.hole2.par
        },
        hole3: {
            par: golfCourse.holes.hole3.par,
            strokes: golfCourse.holes.hole3.par
        },
        hole4: {
            par: golfCourse.holes.hole4.par,
            strokes: golfCourse.holes.hole4.par
        },
        hole5: {
            par: golfCourse.holes.hole5.par,
            strokes: golfCourse.holes.hole5.par
        },
        hole6: {
            par: golfCourse.holes.hole6.par,
            strokes: golfCourse.holes.hole6.par
        },
        hole7: {
            par: golfCourse.holes.hole7.par,
            strokes: golfCourse.holes.hole7.par
        },
        hole8: {
            par: golfCourse.holes.hole8.par,
            strokes: golfCourse.holes.hole8.par
        },
        hole9: {
            par: golfCourse.holes.hole9.par,
            strokes: golfCourse.holes.hole9.par
        },
        hole10: {
            par: golfCourse.holes.hole10.par,
            strokes: golfCourse.holes.hole10.par
        },
        hole11: {
            par: golfCourse.holes.hole11.par,
            strokes: golfCourse.holes.hole11.par
        },
        hole12: {
            par: golfCourse.holes.hole12.par,
            strokes: golfCourse.holes.hole12.par
        },
        hole13: {
            par: golfCourse.holes.hole13.par,
            strokes: golfCourse.holes.hole13.par
        },
        hole14: {
            par: golfCourse.holes.hole14.par,
            strokes: golfCourse.holes.hole14.par
        },
        hole15: {
            par: golfCourse.holes.hole15.par,
            strokes: golfCourse.holes.hole15.par
        },
        hole16: {
            par: golfCourse.holes.hole16.par,
            strokes: golfCourse.holes.hole16.par
        },
        hole17: {
            par: golfCourse.holes.hole17.par,
            strokes: golfCourse.holes.hole17.par
        },
        hole18: {
            par: golfCourse.holes.hole18.par,
            strokes: golfCourse.holes.hole18.par
        },
    }
    return scorecardHoles;
}