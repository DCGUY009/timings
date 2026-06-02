import { Routine, SessionHistoryItem, ChecklistItem } from '../types';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'shambhavi-mahamudra-kriya',
    name: 'Shambhavi Mahamudra Kriya',
    description: 'A sacred 21-minute energy practice transmitted through Isha Foundation. Includes Hatha Yoga preparatory asanas, pranayama, AUM chanting, and meditation.',
    category: 'Focus',
    steps: [
      {
        id: 'smk-1',
        name: 'Patangasana (Butterfly Pose)',
        description: 'Sit straight, bring soles of feet together, and flap thighs gently to loosen up hip joints.',
        duration: 120,
        cue: 'single-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-2',
        name: 'Shishupalasana (Rock Baby - Right)',
        description: 'Cradle your right leg in your arms and rock it side-to-side gently to flex the pelvic region.',
        duration: 120,
        cue: 'single-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-3',
        name: 'Shishupalasana (Rock Baby - Left)',
        description: 'Cradle your left leg in your arms and rock it side-to-side gently to flex the pelvic region.',
        duration: 120,
        cue: 'single-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-4',
        name: 'Nadi Vibhajan (Cat Stretch)',
        description: 'Get on all fours. Arch and hollow the spine rhythmically (3 sets of 10 reps, 10s per rep).',
        duration: 15,
        cue: 'single-chime',
        type: 'interval',
        stepFormat: 'reps',
        sets: 3,
        reps: 10,
        repPace: 10
      },
      {
        id: 'smk-4-rest',
        name: 'Rest',
        description: 'Relax and settle your breath after Cat Stretch.',
        duration: 30,
        cue: 'single-chime',
        type: 'rest',
        stepFormat: 'duration'
      },
      {
        id: 'smk-5',
        name: 'Sukha Kriya (Alternate Nostril)',
        description: 'Sit cross-legged with an erect spine. Effortlessly alternate breathing through left and right nostrils.',
        duration: 360,
        cue: 'double-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-6',
        name: 'AUM Chanting',
        description: 'Take a deep breath and chant AUM on the exhalation. Speak Aaa, Uuuu, and Mmmm equally.',
        duration: 3,
        cue: 'single-chime',
        type: 'work',
        stepFormat: 'audio-loop',
        reps: 21
      },
      {
        id: 'smk-7',
        name: 'Vipareeta Swasa (Belly Breath)',
        description: 'Engage in rapid, fast-paced belly breathing to energize the system.',
        duration: 210,
        cue: 'single-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-8',
        name: 'Bandhas (Muscular Locks)',
        description: 'Engage pelvic floor (Mula), lower abdomen (Uddiyana), and throat lock (Jalandhara) on breath retention.',
        duration: 90,
        cue: 'single-chime',
        type: 'flow',
        stepFormat: 'duration'
      },
      {
        id: 'smk-9',
        name: 'Shambhavi Mudra (Meditation)',
        description: 'Sit in stillness. Tilt head slightly up, eyes closed, focus soft inner gaze between eyebrows.',
        duration: 330,
        cue: 'double-chime',
        type: 'flow',
        stepFormat: 'duration'
      }
    ],
    checklist: [
      { id: 'smk-cl-1', label: 'Empty stomach (4 hours since last meal)', checked: false },
      { id: 'smk-cl-2', label: 'Eyeglasses removed', checked: false },
      { id: 'smk-cl-3', label: 'Quiet space facing East (or North)', checked: false },
      { id: 'smk-cl-4', label: 'Spine erect and posture comfortable', checked: false }
    ]
  },
  {
    id: 'deep-work-block',
    name: 'Deep Work Block',
    description: 'Pomodoro sequence optimized for 90-minute intense focus with tactical rest breaks.',
    category: 'Focus',
    steps: [
      {
        id: 'dw-1',
        name: 'Brain Dump & Goals',
        description: 'Write down all current thoughts, distractions, and precise goals for this block.',
        duration: 300, // 5 min
        cue: 'single-chime',
        type: 'work'
      },
      {
        id: 'dw-2',
        name: 'High Priority Task focus',
        description: 'Submerge fully into your main, high-impact priority task. Minimize tabs.',
        duration: 1500, // 25 min
        cue: 'double-chime',
        type: 'work'
      },
      {
        id: 'dw-3',
        name: 'Tactical Intermission Rest',
        description: 'Stand up, grab water, look at a far-away object to reset visual focus.',
        duration: 300, // 5 min
        cue: 'single-chime',
        type: 'rest'
      },
      {
        id: 'dw-4',
        name: 'Secondary Deep Work Block',
        description: 'Continue primary execution. No email, chat, or phone interaction.',
        duration: 2100, // 35 min
        cue: 'double-chime',
        type: 'work'
      },
      {
        id: 'dw-5',
        name: 'Rest & Stretch',
        description: 'Disconnect. Light stretching for neck and shoulders.',
        duration: 300, // 5 min
        cue: 'single-chime',
        type: 'rest'
      },
      {
        id: 'dw-6',
        name: 'Final Clean Up Sprit',
        description: 'Review what was done, document any blockages, close open tabs.',
        duration: 600, // 10 min
        cue: 'single-chime',
        type: 'work'
      }
    ],
    checklist: [
      { id: 'dw-ec-1', label: 'Close distracting browser tabs', checked: false },
      { id: 'dw-ec-2', label: 'Set Slack / Discord to Away', checked: false },
      { id: 'dw-ec-3', label: 'Noise-canceling headphones ready', checked: false },
      { id: 'dw-ec-4', label: 'Water bottle at desk', checked: false }
    ]
  },
  {
    id: 'sunrise-activation',
    name: 'Sunrise Activation',
    description: 'Hydration, light stretching, and mental preparation for the day.',
    category: 'Morning',
    steps: [
      {
        id: 'sa-1',
        name: 'Mindful Hydration',
        description: 'Drink a large glass of water slowly while standing in neutral posture.',
        duration: 120, // 2 min
        cue: 'single-chime',
        type: 'flow'
      },
      {
        id: 'sa-2',
        name: 'Gentle Joint Warm-up',
        description: 'Slow neck, shoulder, and knee circles to lubricate joints and raise awareness.',
        duration: 180, // 3 min
        cue: 'single-chime',
        type: 'flow'
      },
      {
        id: 'sa-3',
        name: 'Alternate Nostril Breathing',
        description: 'Breathe in slowly through the left nostril, close, hold, and release through the right.',
        duration: 300, // 5 min
        cue: 'double-chime',
        type: 'flow'
      },
      {
        id: 'sa-4',
        name: 'Breath Retention',
        description: 'Deep inhale, hold with relaxed shoulders, and long hum-sigh exhale.',
        duration: 150, // 2m 30s
        cue: 'single-chime',
        type: 'rest'
      },
      {
        id: 'sa-5',
        name: 'Presence Integration',
        description: 'Sit in complete stillness, appreciating the silent conductive rhythm.',
        duration: 300, // 5 min
        cue: 'double-chime',
        type: 'rest'
      }
    ],
    checklist: [
      { id: 'sa-ec-1', label: 'Glass of water prepared', checked: false },
      { id: 'sa-ec-2', label: 'Quiet space with natural light', checked: false },
      { id: 'sa-ec-3', label: 'Comfortable loose clothing', checked: false },
      { id: 'sa-ec-4', label: 'Barefoot or thin socks', checked: false }
    ]
  },
  {
    id: 'kettlebell-hiit',
    name: 'Kettlebell HIIT',
    description: 'High intensity interval training focusing on core and lower body power generators.',
    category: 'Workout',
    steps: [
      {
        id: 'kb-1',
        name: 'Joint Lubrication Circles',
        description: 'Light mobility and cardio activation prep.',
        duration: 300, // 5 min
        cue: 'single-chime',
        type: 'interval'
      },
      {
        id: 'kb-2',
        name: 'Two-Handed Kettlebell Swings',
        description: 'Hinge hips aggressively, drive bell to chest height, core solid.',
        duration: 900, // 15 min
        cue: 'double-chime',
        type: 'interval'
      },
      {
        id: 'kb-3',
        name: 'Goblet Squats & Lunges',
        description: 'Hold bell close to chest, load heels, sit back with power.',
        duration: 1200, // 20 min
        cue: 'double-chime',
        type: 'interval'
      },
      {
        id: 'kb-4',
        name: 'Post-Workout Shavasana Rest',
        description: 'Lay flat on back, breathing diaphragmatically, melting completely into floor.',
        duration: 300, // 5 min
        cue: 'single-chime',
        type: 'rest'
      }
    ],
    checklist: [
      { id: 'kb-ec-1', label: 'Solid non-slip floor checked', checked: false },
      { id: 'kb-ec-2', label: 'Clear 2m x 2m workout arena', checked: false },
      { id: 'kb-ec-3', label: 'Kettlebell handle and weight secure', checked: false },
      { id: 'kb-ec-4', label: 'Sweat towel handy', checked: false }
    ]
  },
  {
    id: 'morning-stretching',
    name: 'Morning Stretching',
    description: 'Focus and posture correction stretch for the neck, shoulders, and deep breathing.',
    category: 'Flexibility',
    steps: [
      {
        id: 'ms-1',
        name: 'Neck Rotation Stretch',
        description: 'Slow neck rolls left to right. Maintain vertical posture and dropped shoulders.',
        duration: 60, // 1:00
        cue: 'single-chime',
        type: 'work'
      },
      {
        id: 'ms-2',
        name: 'Shoulder Extension Extension',
        description: 'Interlace fingers behind back, puff chest outward, pull shoulder blades together.',
        duration: 120, // 2:00
        cue: 'double-chime',
        type: 'work'
      },
      {
        id: 'ms-3',
        name: 'Deep Breathing Rest',
        description: 'Calming pranayama breath to integrate the structural changes.',
        duration: 300, // 5 min? Oh wait, the mockup lists "30 seconds" (00:30) for rest.
        cue: 'silent',
        type: 'rest'
      }
    ],
    checklist: [
      { id: 'ms-ec-1', label: 'Yoga mat or soft carpet', checked: false },
      { id: 'ms-ec-2', label: 'Quiet soothing background noise', checked: false },
      { id: 'ms-ec-3', label: 'Posture checked in reflecting window', checked: false }
    ]
  }
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'ec-1', label: 'Quiet Space Secured', checked: false },
  { id: 'ec-2', label: 'Water Nearby', checked: false },
  { id: 'ec-3', label: 'Yoga Mat / Cushion', checked: false },
  { id: 'ec-4', label: 'Do Not Disturb Enabled', checked: false }
];

export const DEFAULT_HISTORY: SessionHistoryItem[] = [
  {
    id: 'hist-1',
    routineName: 'Deep Work Alpha',
    timestamp: 'Oct 24, 2024 • 09:00 AM',
    durationMinutes: 120,
    completionRate: 100
  },
  {
    id: 'hist-2',
    routineName: 'Morning Flow',
    timestamp: 'Oct 23, 2024 • 08:30 AM',
    durationMinutes: 45,
    completionRate: 100
  },
  {
    id: 'hist-3',
    routineName: 'Writing Sprint',
    timestamp: 'Oct 22, 2024 • 02:15 PM',
    durationMinutes: 90,
    completionRate: 85
  },
  {
    id: 'hist-4',
    routineName: 'Reading Session',
    timestamp: 'Oct 20, 2024 • 08:00 PM',
    durationMinutes: 60,
    completionRate: 100
  }
];
