/** Optional cardio — stay in shape without a race-training week. */

export type CardioOption = {
  id: string;
  title: string;
  focus: string;
  estimatedMin: number;
  main: string;
};

export const optionalCardio: CardioOption[] = [
  {
    id: 'optional_cardio_25',
    title: 'Easy 20–30 min',
    focus: 'Stay in shape — run, treadmill, or bike',
    estimatedMin: 30,
    main: 'Conversational pace. Walk breaks are fine. Skip if legs are cooked from lifting.',
  },
  {
    id: 'optional_cardio_40',
    title: 'Easy 35–45 min',
    focus: 'A little more aerobic work when you feel good',
    estimatedMin: 45,
    main: 'Keep it easy (zone 2). Run, treadmill, or bike all count.',
  },
  {
    id: 'bike_or_treadmill_25',
    title: 'Easy bike / incline walk',
    focus: 'Low-impact option on sore-leg days',
    estimatedMin: 25,
    main: 'Steady, nose-breathing effort. No intervals.',
  },
];
