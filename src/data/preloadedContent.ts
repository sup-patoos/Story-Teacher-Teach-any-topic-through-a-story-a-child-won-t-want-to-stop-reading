/**
 * @file preloadedContent.ts
 * Pre-loaded, fully verified curriculum and curiosity topics for StoryLearn.
 * Ensures the app has immediate, rich, zero-latency content on first run.
 */

import { InteractiveStory, QuizData, CorrectiveStory } from '../types/learning';

export interface PreloadedTopicBundle {
  conceptId: string;
  topicTitle: string;
  subject: string;
  level: string;
  classNum?: number;
  subtopicTitle?: string;
  videoId?: string | null;
  isTeacherVerified: boolean;
  story: InteractiveStory;
  quiz: QuizData;
  corrective: CorrectiveStory;
}

export const PRELOADED_TOPICS: Record<string, PreloadedTopicBundle> = {
  // 1. Class 9 Physics - Distance and Displacement
  'c9-physics-ch01-s1': {
    conceptId: 'c9-physics-ch01-s1',
    topicTitle: 'Distance and displacement, uniform and non-uniform motion',
    subject: 'Physics',
    level: 'Class 9',
    classNum: 9,
    subtopicTitle: 'Distance and displacement, uniform and non-uniform motion',
    videoId: 'JQf79GCKHfY',
    isTeacherVerified: true,
    story: {
      title: 'The Great Chandni Chowk Auto Race',
      concept: 'Distance and Displacement',
      conceptId: 'c9-physics-ch01-s1',
      level: 'Class 9',
      subject: 'Physics',
      targetAgeGroup: '13-15 years',
      summary: 'Kabir and Ananya must deliver jalebis across Old Delhi, discovering that walking through winding alleys racks up huge distance, but displacement only cares about the straight line between start and finish.',
      isTeacherVerified: true,
      scenes: [
        {
          sceneNumber: 1,
          header: 'The Jalebi Emergency',
          text: 'Kabir and his sister Ananya were tasked with delivering a box of piping-hot jalebis from their grandfather’s sweet shop at Ghantaghar to Aunt Meera’s terrace near the Red Fort. Kabir pulled out his pedometer smartwatch proudly.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Two Indian teenagers standing in front of a colorful traditional sweet shop in Old Delhi with boxes of jalebi',
            emoji: '🛵',
            widget: {
              template: 'numberline',
              parameters: {
                label: 'Position along the street (meters)',
                unit: 'm',
                min: 0,
                max: 500,
                defaultValue: 0,
                points: [
                  { value: 0, label: 'Sweet Shop (Origin)', color: '#10b981' },
                  { value: 400, label: 'Red Fort Gate', color: '#f59e0b' }
                ],
                explanation: 'Our journey begins at position 0 meters.'
              }
            }
          },
          interaction: null
        },
        {
          sceneNumber: 2,
          header: 'The Maze of Paranthe Wali Gali',
          text: '“Let’s take the shortcut!” shouted Kabir. But the narrow lane twisted left, curved right, doubled back around a sleeping cow, and looped around a spice cart. Kabir walked 300 meters forward, 200 meters sideways, and another 100 meters backtracking.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Winding alleys in Delhi with auto rickshaws, bicycles and colorful market stalls',
            emoji: '🧭',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Winding Path Walked (Distance)',
                unit: 'm',
                min: 100,
                max: 800,
                defaultValue: 600,
                step: 50,
                explanation: 'Notice how every single step adds up to the total distance traveled!'
              }
            }
          },
          interaction: {
            type: 'choice',
            prompt: 'Kabir walked 300m + 200m + 100m = 600m total. What did his smartwatch measure?',
            options: [
              'His displacement (straight-line gap)',
              'His distance (total actual path length traveled)',
              'His acceleration'
            ],
            correctAnswer: 'His distance (total actual path length traveled)',
            explanation: 'Distance is a scalar quantity: it measures the entire ground covered, regardless of turns.',
            reactionCorrect: 'Spot on! Distance accumulates every single meter walked.',
            reactionIncorrect: 'Not quite! The pedometer adds every step, so it measures total path length: distance!'
          }
        },
        {
          sceneNumber: 3,
          header: 'The Pigeon’s View from Above',
          text: 'Ananya looked up at a pigeon soaring straight over the rooftops from the sweet shop directly to Aunt Meera’s terrace. “Look Kabir! While your watch logged 600 meters of winding alleys, the pigeon flew only 250 meters in a straight line northeast!”',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Aerial top-down diagram comparing a winding red path on the ground with a straight blue arrow through the air',
            emoji: '🕊️',
            widget: {
              template: 'graph',
              parameters: {
                xAxisLabel: 'Eastward Position (m)',
                yAxisLabel: 'Northward Position (m)',
                explanation: 'Displacement is the straight arrow directly from Initial to Final position with direction.'
              }
            }
          },
          interaction: {
            type: 'predict',
            prompt: 'What happens if Kabir delivers the jalebis and immediately walks all the way back to the sweet shop?',
            options: [
              'Both distance and displacement double',
              'Distance is 1200 meters, but his displacement becomes 0 meters',
              'His displacement becomes 600 meters'
            ],
            correctAnswer: 'Distance is 1200 meters, but his displacement becomes 0 meters',
            explanation: 'Since Kabir returns to the exact starting point, the net change in position (displacement) is zero!',
            reactionCorrect: 'Brilliant deduction! When initial and final positions coincide, displacement is exactly zero.',
            reactionIncorrect: 'Remember: displacement = final position minus initial position. If you return to start, displacement is zero!'
          }
        },
        {
          sceneNumber: 4,
          header: 'The Physics Triumph',
          text: 'Kabir gasped. “So distance is the tired legs from every twist and turn, but displacement is the shortest straight line between where you started and where you ended!” Aunt Meera smiled, handing them steaming cups of cardamom chai.',
          visual: {
            type: 'both',
            illustrationPrompt: 'Grandfather, Aunt Meera and the two teenagers laughing together with chai on a Delhi rooftop at dusk',
            emoji: '☕',
            widget: {
              template: 'none',
              parameters: {
                explanation: 'Distance is scalar (magnitude only); Displacement is vector (magnitude + direction).'
              }
            }
          },
          interaction: null
        }
      ]
    },
    quiz: {
      topic: 'Distance and displacement, uniform and non-uniform motion',
      conceptId: 'c9-physics-ch01-s1',
      level: 'Class 9',
      isTeacherVerified: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'An athlete runs once around a circular track of radius 70 meters and finishes at the exact starting point. What is their displacement?',
          options: ['440 meters', '0 meters', '140 meters', '70 meters'],
          correctAnswer: '0 meters',
          misconceptionTarget: 'Believing displacement is the perimeter of a track rather than final minus initial position',
          rubric: 'Displacement measures shortest straight vector from start to finish. Returning to start implies zero displacement.'
        },
        {
          id: 'q2',
          type: 'prediction',
          prompt: 'Can the magnitude of displacement ever be strictly greater than the distance traveled by a moving particle?',
          options: [
            'Yes, when an object moves very fast',
            'No, displacement magnitude is always less than or equal to distance',
            'Yes, when moving in a circular path'
          ],
          correctAnswer: 'No, displacement magnitude is always less than or equal to distance',
          misconceptionTarget: 'Thinking displacement can exceed the distance traveled',
          rubric: 'The straight line between two points is the shortest possible path, so distance >= |displacement|.'
        },
        {
          id: 'q3',
          type: 'application',
          prompt: 'A delivery drone travels 3 km East, then 4 km North. What is the total distance traveled, and what is its net displacement magnitude?',
          options: [
            'Distance = 7 km; Displacement = 5 km',
            'Distance = 5 km; Displacement = 7 km',
            'Distance = 7 km; Displacement = 7 km',
            'Distance = 12 km; Displacement = 5 km'
          ],
          correctAnswer: 'Distance = 7 km; Displacement = 5 km',
          misconceptionTarget: 'Confusing scalar addition with vector triangle (Pythagoras theorem)',
          rubric: 'Distance = 3 + 4 = 7 km. Displacement by Pythagoras = sqrt(3^2 + 4^2) = 5 km.'
        },
        {
          id: 'q4',
          type: 'short_answer',
          prompt: 'Does distance have a specific direction in space, or is it a scalar quantity?',
          acceptableKeywords: ['scalar', 'no direction', 'magnitude only'],
          misconceptionTarget: 'Failing to identify scalar vs vector characteristics',
          rubric: 'Distance only has numerical magnitude with no direction; it is a scalar quantity.'
        },
        {
          id: 'q5',
          type: 'in_your_own_words',
          prompt: 'In your own words, explain how a person can walk 10,000 steps around a park and end up with zero displacement.',
          acceptableKeywords: ['loop', 'start', 'finish', 'initial', 'final', 'same point', 'return'],
          misconceptionTarget: 'Equating sweat/effort/distance to displacement',
          rubric: 'A clear explanation notes that if the start and end locations are identical, the net shift in position is zero regardless of steps.'
        }
      ]
    },
    corrective: {
      title: 'The Boomerang Experiment',
      concept: 'Distance vs Displacement',
      targetedMisconception: 'Assuming displacement is the total distance walked or that displacement cannot be zero for a moving body.',
      scenes: [
        {
          header: 'The Boomerang in the Park',
          text: 'Imagine throwing a wooden boomerang. It swoops through a gigantic 100-meter curve in the air, rustling the treetops, and drops right back into your outstretched palm.',
          visualEmoji: '🪃'
        },
        {
          header: 'The Net Shift',
          text: 'The boomerang traveled 100 meters of distance through the sky. But where is it now relative to where you threw it? Exactly in your hand! Its displacement is 0 meters.',
          visualEmoji: '🎯'
        }
      ],
      takeaway: 'Distance counts every centimeter of travel. Displacement only asks: "How far are you from where you started, in a straight arrow?"',
      recheckQuestions: [
        {
          prompt: 'A toy train travels around a 10-meter circular track 5 times and stops at the station where it began. What is its displacement?',
          options: ['50 meters', '0 meters', '10 meters'],
          correctAnswer: '0 meters',
          explanation: 'It started and ended at the station, so the net change in position is 0 meters.'
        }
      ]
    }
  },

  // 2. Class 9 Physics - Speed, Velocity, Acceleration
  'c9-physics-ch01-s2': {
    conceptId: 'c9-physics-ch01-s2',
    topicTitle: 'Speed, velocity, acceleration',
    subject: 'Physics',
    level: 'Class 9',
    classNum: 9,
    subtopicTitle: 'Speed, velocity, acceleration',
    videoId: 'aOf_WzLwcBc',
    isTeacherVerified: true,
    story: {
      title: 'The Shatabdi Express Challenge',
      concept: 'Speed, Velocity and Acceleration',
      conceptId: 'c9-physics-ch01-s2',
      level: 'Class 9',
      subject: 'Physics',
      targetAgeGroup: '13-15 years',
      summary: 'Aboard the high-speed Shatabdi Express through Uttar Pradesh, Rohan learns why turning a sharp corner at a constant 80 km/h is still accelerated motion!',
      isTeacherVerified: true,
      scenes: [
        {
          sceneNumber: 1,
          header: 'Cruising the Northern Plains',
          text: 'Rohan watched the golden mustard fields blur past the train window. The electronic cabin display read: "Speed: 110 km/h". Rohan remarked, “We are moving fast, but my chai isn’t spilling at all!”',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Modern blue Indian express train speeding past bright yellow mustard fields in rural India',
            emoji: '🚄',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Train Speed',
                unit: 'km/h',
                min: 0,
                max: 160,
                defaultValue: 110,
                step: 10,
                explanation: 'Speed is distance divided by time: 110 km covered in each hour.'
              }
            }
          },
          interaction: null
        },
        {
          sceneNumber: 2,
          header: 'The Direction Twist',
          text: 'Uncle Vikram, a railway engineer sitting opposite, smiled. “Speed tells you how fast you are moving. But velocity adds direction: 110 km/h due East. If the train maintains 110 km/h but curves around a giant hill toward the South, has its velocity changed?”',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Railway tracks bending sharply in a scenic curve with speed gauge showing steady 110',
            emoji: '🧭',
            widget: {
              template: 'graph',
              parameters: {
                xAxisLabel: 'Time (seconds)',
                yAxisLabel: 'Velocity Vector Direction (degrees)',
                explanation: 'When direction changes, velocity vector changes, even if speedometer reading stays constant.'
              }
            }
          },
          interaction: {
            type: 'choice',
            prompt: 'If speed remains 110 km/h but the direction changes from East to South, did velocity change?',
            options: [
              'No, because speed is still 110 km/h',
              'Yes, because velocity depends on both speed and direction',
              'Only if the brakes were applied'
            ],
            correctAnswer: 'Yes, because velocity depends on both speed and direction',
            explanation: 'Velocity is a vector! A change in magnitude OR a change in direction means velocity has changed.',
            reactionCorrect: 'Spot on! Velocity includes direction, so changing direction changes velocity.',
            reactionIncorrect: 'Remember: velocity is speed WITH direction. Turning the wheel changes velocity!'
          }
        },
        {
          sceneNumber: 3,
          header: 'The Sharp Curve and the Chai',
          text: 'Suddenly, the train leaned into a sweeping curve. Rohan felt himself pressed gently toward the window, and the surface of his chai tilted! “We are accelerating!” cried Rohan.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Cup of chai on a train table slanting as train rounds a curve, illustrating lateral acceleration',
            emoji: '☕',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Rate of Change of Velocity (Acceleration)',
                unit: 'm/s²',
                min: -5,
                max: 5,
                defaultValue: 2,
                step: 0.5,
                explanation: 'Acceleration = (Final Velocity - Initial Velocity) / Time taken.'
              }
            }
          },
          interaction: {
            type: 'predict',
            prompt: 'If a car travels along a circular roundabout at an unvarying speed of 40 km/h, is its acceleration zero or non-zero?',
            options: [
              'Zero, because speed is constant',
              'Non-zero, because direction is continuously changing',
              'Infinite, because it is in a circle'
            ],
            correctAnswer: 'Non-zero, because direction is continuously changing',
            explanation: 'Since direction turns continuously in a circle, velocity changes continuously, producing centripetal acceleration!',
            reactionCorrect: 'Outstanding! Continuous turning requires acceleration even at constant speed.',
            reactionIncorrect: 'A common trap! Even at steady speed, turning means velocity is changing, which requires acceleration!'
          }
        },
        {
          sceneNumber: 4,
          header: 'Pulling into Kanpur Junction',
          text: 'The train smoothly decelerated as the platforms of Kanpur approached. “Negative acceleration—retardation!” Rohan announced happily. Uncle Vikram applauded: “You are officially thinking like a physicist!”',
          visual: {
            type: 'illustration',
            illustrationPrompt: 'Crowded Indian railway station at evening with glowing lights as train comes to a gentle stop',
            emoji: '🚉',
            widget: {
              template: 'none',
              parameters: {}
            }
          },
          interaction: null
        }
      ]
    },
    quiz: {
      topic: 'Speed, velocity, acceleration',
      conceptId: 'c9-physics-ch01-s2',
      level: 'Class 9',
      isTeacherVerified: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What is the SI unit of acceleration?',
          options: ['m/s', 'm/s²', 'km/h', 'm · s'],
          correctAnswer: 'm/s²',
          misconceptionTarget: 'Confusing velocity unit with acceleration unit',
          rubric: 'Acceleration is change in velocity (m/s) per second (s), giving m/s².'
        },
        {
          id: 'q2',
          type: 'prediction',
          prompt: 'A car accelerates uniformly from rest to 20 m/s in 5 seconds. What is its acceleration?',
          options: ['4 m/s²', '100 m/s²', '2 m/s²', '0.25 m/s²'],
          correctAnswer: '4 m/s²',
          misconceptionTarget: 'Calculation error with formula a = (v - u) / t',
          rubric: 'a = (20 - 0) / 5 = 4 m/s².'
        },
        {
          id: 'q3',
          type: 'application',
          prompt: 'An artificial satellite circles Earth in an orbit at a steady speed of 7 km/s. Does it have acceleration?',
          options: [
            'Yes, directed toward Earth due to constant change in direction',
            'No, because its speed is constant',
            'No, because there is no friction in space'
          ],
          correctAnswer: 'Yes, directed toward Earth due to constant change in direction',
          misconceptionTarget: 'Believing zero change in speed guarantees zero acceleration',
          rubric: 'Circular motion at constant speed requires centripetal acceleration toward the center.'
        },
        {
          id: 'q4',
          type: 'short_answer',
          prompt: 'What special term is used for negative acceleration when an object slows down?',
          acceptableKeywords: ['retardation', 'deceleration'],
          misconceptionTarget: 'Not knowing deceleration / retardation terminology',
          rubric: 'Negative acceleration is referred to as retardation or deceleration.'
        },
        {
          id: 'q5',
          type: 'in_your_own_words',
          prompt: 'Explain the key difference between speed and velocity in everyday terms.',
          acceptableKeywords: ['direction', 'scalar', 'vector', 'how fast', 'where'],
          misconceptionTarget: 'Treating speed and velocity as identical synonyms',
          rubric: 'Speed only tells how fast something moves; velocity specifies both how fast and in what direction.'
        }
      ]
    },
    corrective: {
      title: 'The Merry-Go-Round Revelation',
      concept: 'Acceleration with Constant Speed',
      targetedMisconception: 'Believing acceleration only exists when you press the gas pedal to speed up.',
      scenes: [
        {
          header: 'Riding the Mela Carousel',
          text: 'You are on a brightly painted wooden horse on a mela carousel spinning at a steady 5 km/h.',
          visualEmoji: '🎠'
        },
        {
          header: 'The Tugging Force',
          text: 'Your speedometer stays at 5 km/h, but one second you face North, the next East, then South! You constantly feel yourself being pulled inward. That pull is needed because your velocity is constantly changing direction!',
          visualEmoji: '🔄'
        }
      ],
      takeaway: 'Acceleration is ANY change in velocity. Changing speed is acceleration, and changing direction is ALSO acceleration!',
      recheckQuestions: [
        {
          prompt: 'A bicyclist rounds a street bend at an unchanging 15 km/h. Does the bicyclist accelerate?',
          options: ['Yes, direction changes', 'No, speed is constant'],
          correctAnswer: 'Yes, direction changes',
          explanation: 'Turning changes direction, which changes the velocity vector, so acceleration is present.'
        }
      ]
    }
  },

  // 3. Class 7 Maths - Properties of Addition and Subtraction of Integers
  'c7-math-ch01-s1': {
    conceptId: 'c7-math-ch01-s1',
    topicTitle: 'Properties of addition and subtraction of integers',
    subject: 'Mathematics',
    level: 'Class 7',
    classNum: 7,
    subtopicTitle: 'Properties of addition and subtraction of integers',
    videoId: null,
    isTeacherVerified: true,
    story: {
      title: 'Captain Dev and the Deep Coral Submarine',
      concept: 'Addition and Subtraction of Integers',
      conceptId: 'c7-math-ch01-s1',
      level: 'Class 7',
      subject: 'Mathematics',
      targetAgeGroup: '11-13 years',
      summary: 'Captain Dev dives his submarine off the Andaman coast. Navigating depths below sea level (- meters) teaches young crewmate Priya why subtracting a negative integer actually lifts the submarine upward!',
      isTeacherVerified: true,
      scenes: [
        {
          sceneNumber: 1,
          header: 'Zero at Sea Level',
          text: 'Captain Dev stood at the glass helm of the submarine "Matsya". “Sea level is our baseline: 0 meters. Rising into the air is positive (+), but diving beneath the blue waves is negative (-).”',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Futuristic yellow research submarine floating at the ocean surface next to a tropical coral reef',
            emoji: '🌊',
            widget: {
              template: 'numberline',
              parameters: {
                label: 'Ocean Elevation Gauge',
                unit: 'm',
                min: -50,
                max: 50,
                defaultValue: 0,
                points: [
                  { value: 0, label: 'Sea Level', color: '#3b82f6' },
                  { value: -30, label: 'Coral Cave', color: '#ef4444' }
                ],
                explanation: '0 is surface level. Depths are negative integers.'
              }
            }
          },
          interaction: null
        },
        {
          sceneNumber: 2,
          header: 'Diving to the Coral Caves',
          text: '“Engine room, dive 25 meters!” ordered Captain Dev. Matsya descended to -25 meters. Then a school of manta rays swam by 15 meters further down. Matsya descended another 15 meters: (-25) + (-15).',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Deep blue water with glowing bioluminescent fish and sea turtle',
            emoji: '🤿',
            widget: {
              template: 'numberline',
              parameters: {
                label: 'Depth Meter',
                unit: 'm',
                min: -50,
                max: 10,
                defaultValue: -40,
                points: [
                  { value: -25, label: 'First Stop', color: '#f59e0b' },
                  { value: -40, label: 'Manta Rays', color: '#ec4899' }
                ],
                explanation: 'Adding two negative integers moves you further down to the left on the number line.'
              }
            }
          },
          interaction: {
            type: 'choice',
            prompt: 'What is (-25) + (-15)?',
            options: ['-40 meters', '-10 meters', '+40 meters', '+10 meters'],
            correctAnswer: '-40 meters',
            explanation: 'When adding two negative numbers, you combine their absolute values and keep the negative sign: 25 + 15 = 40, so -40.',
            reactionCorrect: 'Spot on! Diving deeper adds negative depths to reach -40 meters.',
            reactionIncorrect: 'Remember: diving 25m down and another 15m down means you are 40m underwater: -40 meters.'
          }
        },
        {
          sceneNumber: 3,
          header: 'The Ballast Bag Riddle',
          text: 'At -40 meters, the submarine was carrying heavy lead sandbags labeled -10 kg each. Crewmate Priya detached three sandbags. “Removing negative weight: (-40) - (-15)!” As the heavy ballast detached, the submarine surged upward to -25 meters!',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Submarine releasing heavy weights and rising gracefully through sunlit turquoise water',
            emoji: '🎈',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Remove Negative Weight [Subtracting Negative]',
                unit: 'm',
                min: -50,
                max: 0,
                defaultValue: -25,
                step: 5,
                explanation: 'Subtracting a negative number is mathematically identical to adding a positive number: a - (-b) = a + b.'
              }
            }
          },
          interaction: {
            type: 'predict',
            prompt: 'Why does subtracting a negative number cause the submarine to rise?',
            options: [
              'Because removing weight/debt makes you go UP (positive)',
              'Because negative numbers always become zero',
              'Because the engine runs in reverse'
            ],
            correctAnswer: 'Because removing weight/debt makes you go UP (positive)',
            explanation: 'Taking away a negative is equivalent to adding a positive: -(-15) = +15!',
            reactionCorrect: 'Magnificent insight! Removing cold ballast or debt makes you lighter and lifts you up.',
            reactionIncorrect: 'Think of it as canceling debt: taking away a negative value increases your net value!'
          }
        },
        {
          sceneNumber: 4,
          header: 'Safe at the Andaman Port',
          text: 'Priya grinned. “Negative integers aren’t scary at all! Commutative property works for addition [(-5) + 3 = 3 + (-5)], but watch out: subtraction isn’t commutative!” Captain Dev saluted his sharp new navigator.',
          visual: {
            type: 'illustration',
            illustrationPrompt: 'Captain Dev and Priya smiling on submarine deck under tropical sunshine in Port Blair',
            emoji: '⚓',
            widget: {
              template: 'none',
              parameters: {}
            }
          },
          interaction: null
        }
      ]
    },
    quiz: {
      topic: 'Properties of addition and subtraction of integers',
      conceptId: 'c7-math-ch01-s1',
      level: 'Class 7',
      isTeacherVerified: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What is the value of (-12) - (-8)?',
          options: ['-4', '-20', '+4', '+20'],
          correctAnswer: '-4',
          misconceptionTarget: 'Mishandling double negative: subtracting a negative adds the value',
          rubric: '(-12) - (-8) = -12 + 8 = -4.'
        },
        {
          id: 'q2',
          type: 'prediction',
          prompt: 'Is subtraction of integers commutative? For example, is (5 - 8) equal to (8 - 5)?',
          options: ['No, because 5 - 8 = -3 while 8 - 5 = 3', 'Yes, order never matters in maths'],
          correctAnswer: 'No, because 5 - 8 = -3 while 8 - 5 = 3',
          misconceptionTarget: 'Assuming all operations are commutative like addition',
          rubric: 'Subtraction is not commutative: a - b != b - a for distinct integers.'
        },
        {
          id: 'q3',
          type: 'application',
          prompt: 'The temperature in Leh at midnight was -7°C. By afternoon it rose by 11°C. What was the afternoon temperature?',
          options: ['+4°C', '-18°C', '+18°C', '-4°C'],
          correctAnswer: '+4°C',
          misconceptionTarget: 'Sign error when crossing zero on temperature scale',
          rubric: '-7 + 11 = +4°C.'
        },
        {
          id: 'q4',
          type: 'short_answer',
          prompt: 'What integer is its own additive inverse, such that x + (-x) = 0 and x = -x?',
          acceptableKeywords: ['0', 'zero'],
          misconceptionTarget: 'Thinking zero has positive or negative sign',
          rubric: 'Zero is the only integer that equals its own opposite.'
        },
        {
          id: 'q5',
          type: 'in_your_own_words',
          prompt: 'Explain to a friend why subtracting (-5) gives the same answer as adding (+5).',
          acceptableKeywords: ['debt', 'opposite', 'cancel', 'minus minus', 'weight', 'left right'],
          misconceptionTarget: 'Rote memorization without understanding why minus minus becomes plus',
          rubric: 'Taking away a loss or debt increases your net balance, just like receiving a gain.'
        }
      ]
    },
    corrective: {
      title: 'The Borrowed Books Riddle',
      concept: 'Subtracting a Negative Number',
      targetedMisconception: 'Believing that subtracting always makes a number smaller.',
      scenes: [
        {
          header: 'Owing 5 Rupees',
          text: 'Suppose you owe your school canteen 5 rupees: your balance is -5. Now the kind canteen uncle forgives your debt and cancels the -5 record.',
          visualEmoji: '🪙'
        },
        {
          header: 'The Net Relief',
          text: 'Subtracting your debt of 5 leaves you with: (-5) - (-5) = 0. Removing a negative lifted your balance from -5 all the way up to 0!',
          visualEmoji: '📈'
        }
      ],
      takeaway: 'Subtracting a negative removes a decrease—which is the same as adding an increase!',
      recheckQuestions: [
        {
          prompt: 'Solve: 10 - (-6)',
          options: ['16', '4', '-16'],
          correctAnswer: '16',
          explanation: '10 - (-6) = 10 + 6 = 16.'
        }
      ]
    }
  },

  // 4. Class 7 Science - Acids, Bases and Salts (Natural Indicators)
  'c7-chemistry-ch01-s1': {
    conceptId: 'c7-chemistry-ch01-s1',
    topicTitle: 'Natural indicators: litmus, turmeric, China rose',
    subject: 'Chemistry',
    level: 'Class 7',
    classNum: 7,
    subtopicTitle: 'Natural indicators: litmus, turmeric, China rose',
    videoId: null,
    isTeacherVerified: true,
    story: {
      title: 'The Great Turmeric Curry Detective',
      concept: 'Acids, Bases and Natural Indicators',
      conceptId: 'c7-chemistry-ch01-s1',
      level: 'Class 7',
      subject: 'Chemistry',
      targetAgeGroup: '11-13 years',
      summary: 'At a wedding feast in Jaipur, Aryan accidentally spills yellow turmeric curry on his crisp white kurta. When his mother washes it with soap, it magically turns brick-red! Why?',
      isTeacherVerified: true,
      scenes: [
        {
          sceneNumber: 1,
          header: 'The Samosa Disaster',
          text: 'At his cousin’s wedding, 12-year-old Aryan dropped a piece of spicy paneer tikka onto his white kurta. A bright yellow turmeric (haldi) stain spread across the cotton fabric.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Teenager in Indian traditional white kurta looking shocked at a bright yellow curry stain',
            emoji: '🍛',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Turmeric Stain Intensity',
                unit: '%',
                min: 0,
                max: 100,
                defaultValue: 80,
                explanation: 'Turmeric contains curcumin, a natural dye that responds to acidity and basicity.'
              }
            }
          },
          interaction: null
        },
        {
          sceneNumber: 2,
          header: 'The Crimson Transformation',
          text: 'Aryan rushed to the bathroom and rubbed laundry soap vigorously on the yellow stain. To his utter shock, the yellow stain did not wash away—it flashed into an intense, deep reddish-brown!',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Yellow stain on fabric turning bright red when touched by soap foam',
            emoji: '🧼',
            widget: {
              template: 'dragdrop',
              parameters: {
                categories: ['Acidic Substances', 'Basic Substances'],
                items: [
                  { id: 'lemon', text: 'Lemon Juice', correctCategory: 'Acidic Substances', emoji: '🍋' },
                  { id: 'soap', text: 'Washing Soap', correctCategory: 'Basic Substances', emoji: '🧼' },
                  { id: 'vinegar', text: 'Vinegar', correctCategory: 'Acidic Substances', emoji: '🍶' },
                  { id: 'baking_soda', text: 'Baking Soda Solution', correctCategory: 'Basic Substances', emoji: '🧂' }
                ],
                explanation: 'Soap contains bases (like sodium hydroxide). Bases turn turmeric reddish-brown!'
              }
            }
          },
          interaction: {
            type: 'choice',
            prompt: 'Why did the yellow turmeric stain turn red when soap was applied?',
            options: [
              'Soap is basic, and turmeric turns red in basic solutions',
              'Soap is acidic, and turmeric hates acids',
              'The fabric burned from heat'
            ],
            correctAnswer: 'Soap is basic, and turmeric turns red in basic solutions',
            explanation: 'Soap is basic in nature. Turmeric is a natural indicator that stays yellow in acids/neutral solutions but turns red in bases!',
            reactionCorrect: 'Spot on! Soap is a base, and turmeric is an indicator that turns reddish-brown in basic mediums.',
            reactionIncorrect: 'Remember: soap is basic! Turmeric stays yellow in acids, but turns red in basic solutions.'
          }
        },
        {
          sceneNumber: 3,
          header: 'The Lemon Juice Reversal',
          text: 'His aunt smiled and sliced a fresh lemon. She squeezed a few drops of sour lemon juice onto the scary red stain. Before Aryan’s eyes, the red faded right back to bright sunny yellow! Lemon acid neutralized the soap base.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Lemon drops squeezing onto red stain, restoring the bright yellow color',
            emoji: '🍋',
            widget: {
              template: 'pie',
              parameters: {
                slices: [
                  { label: 'Acid (Citric Acid)', value: 50, color: '#eab308' },
                  { label: 'Base (Soap Residue)', value: 50, color: '#ef4444' }
                ],
                explanation: 'Acid neutralizes base. When the base is neutralized, turmeric returns to yellow!'
              }
            }
          },
          interaction: {
            type: 'predict',
            prompt: 'What color will a piece of blue litmus paper turn when dipped into lemon juice?',
            options: ['Red', 'Green', 'Yellow', 'Stays Blue'],
            correctAnswer: 'Red',
            explanation: 'Acids turn blue litmus red. Bases turn red litmus blue.',
            reactionCorrect: 'Brilliant! Acids turn blue litmus red (remember: Acid = Red alert!).',
            reactionIncorrect: 'Acids turn blue litmus paper red! A handy rhyme: "Blue to red, acid said."'
          }
        },
        {
          sceneNumber: 4,
          header: 'Nature’s Chemistry Lab',
          text: 'Aryan marveled: “Litmus from lichens, turmeric from roots, China rose petals turning magenta in acid and green in base... our kitchen is a full chemistry laboratory!” He proudly wore his science badge for the evening.',
          visual: {
            type: 'illustration',
            illustrationPrompt: 'Kitchen table with china rose petals, turmeric paste, lemon slices and test tubes in warm Indian home',
            emoji: '🌺',
            widget: {
              template: 'none',
              parameters: {}
            }
          },
          interaction: null
        }
      ]
    },
    quiz: {
      topic: 'Natural indicators: litmus, turmeric, China rose',
      conceptId: 'c7-chemistry-ch01-s1',
      level: 'Class 7',
      isTeacherVerified: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What color does China rose (Gudhal) indicator turn in a basic solution?',
          options: ['Green', 'Dark pink (magenta)', 'Yellow', 'Colorless'],
          correctAnswer: 'Green',
          misconceptionTarget: 'Confusing China rose color changes (magenta in acid, green in base)',
          rubric: 'China rose petals turn warm magenta/dark pink in acids and light green in bases.'
        },
        {
          id: 'q2',
          type: 'prediction',
          prompt: 'If you apply turmeric paste on a greeting card and draw with baking soda solution on a cotton bud, what color will the drawing appear?',
          options: ['Red', 'Yellow', 'Blue', 'Black'],
          correctAnswer: 'Red',
          misconceptionTarget: 'Not recognizing baking soda as a base that turns turmeric red',
          rubric: 'Baking soda solution is alkaline/basic, reacting with turmeric to produce a red drawing.'
        },
        {
          id: 'q3',
          type: 'application',
          prompt: 'Litmus dye is extracted from which organism found growing on tree bark and rocks?',
          options: ['Lichens', 'Algae', 'Mushrooms', 'Neem leaves'],
          correctAnswer: 'Lichens',
          misconceptionTarget: 'Thinking litmus is synthetic rather than naturally extracted from lichens',
          rubric: 'Litmus is a natural indicator obtained from lichens.'
        },
        {
          id: 'q4',
          type: 'short_answer',
          prompt: 'What taste is characteristic of common acidic substances like tamarind and unripe mangoes?',
          acceptableKeywords: ['sour', 'sour taste'],
          misconceptionTarget: 'Confusing bitter (base) with sour (acid)',
          rubric: 'Acids taste sour, while bases taste bitter.'
        },
        {
          id: 'q5',
          type: 'in_your_own_words',
          prompt: 'Why does rinsing a turmeric stain with lots of water after soap eventually restore the yellow color?',
          acceptableKeywords: ['wash away', 'neutral', 'base removed', 'diluted', 'soap gone'],
          misconceptionTarget: 'Believing the chemical change is permanent destruction of turmeric',
          rubric: 'Water washes away and dilutes the basic soap molecules, returning the medium to neutral where turmeric is yellow.'
        }
      ]
    },
    corrective: {
      title: 'The Mystery of the Bitter Soap',
      concept: 'Acids vs Bases and Indicators',
      targetedMisconception: 'Assuming all cleaning agents are acidic or that indicators are permanent dyes.',
      scenes: [
        {
          header: 'The Taste and Feel Test',
          text: 'Acids taste sour (like lemons and vinegar). Bases taste bitter and feel slippery/soapy between your fingers (like soap and whitewash).',
          visualEmoji: '🧼'
        },
        {
          header: 'The Indicator Traffic Light',
          text: 'An indicator is just like a traffic light: it changes color to announce who is present. Turmeric shines yellow for acids and neutrals, and flashes red ONLY for bases!',
          visualEmoji: '🚦'
        }
      ],
      takeaway: 'Turmeric turns red in basic solutions (like soap and baking soda) and stays yellow in acids (like lemon and vinegar).',
      recheckQuestions: [
        {
          prompt: 'If you drop vinegar onto yellow turmeric paste, does it turn red?',
          options: ['No, it stays yellow', 'Yes, it turns red'],
          correctAnswer: 'No, it stays yellow',
          explanation: 'Vinegar is acidic, so turmeric remains yellow.'
        }
      ]
    }
  },

  // 5. Curiosity / Explore Topic - Why do we have seasons?
  'why-do-we-have-seasons': {
    conceptId: 'why-do-we-have-seasons',
    topicTitle: 'Why do we have seasons?',
    subject: 'Environment',
    level: 'Intermediate',
    subtopicTitle: 'Earth axial tilt, equinoxes, and solstices',
    videoId: null,
    isTeacherVerified: true,
    story: {
      title: 'Tara’s Mango Orchard and the Tilted Globe',
      concept: 'Earth’s Axial Tilt and Seasons',
      conceptId: 'why-do-we-have-seasons',
      level: 'Intermediate',
      subject: 'Environment',
      targetAgeGroup: '11-15 years',
      summary: 'Tara wonders why hot mango season arrives in June when her cousin in Australia is wearing a woolen sweater! A flashlight experiment with a tilted globe exposes the biggest misconception in astronomy.',
      isTeacherVerified: true,
      scenes: [
        {
          sceneNumber: 1,
          header: 'The Summer Mango Puzzle',
          text: 'In the scorching heat of May in Lucknow, juicy Dussehri mangoes were ripening. Tara video-called her cousin Leo in Melbourne, Australia. To her bewilderment, Leo was shivering in a fleece jacket by a radiator!',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Split screen of girl eating sweet mango in sunny India and boy shivering in coat in Melbourne winter',
            emoji: '🥭',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Earth’s Axial Tilt (degrees)',
                unit: '°',
                min: 0,
                max: 45,
                defaultValue: 23.5,
                step: 0.5,
                explanation: 'Earth spins tilted at an angle of 23.5 degrees relative to its orbital plane.'
              }
            }
          },
          interaction: null
        },
        {
          sceneNumber: 2,
          header: 'The Distance Fallacy Busted',
          text: '“Wait,” said Tara. “I thought summer happens because Earth travels closer to the Sun! But if Earth were closer to the Sun in June, wouldn’t BOTH India and Australia be burning hot at the same time?”',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Diagram of Earth revolving around the sun showing elliptical orbit and tilted axis',
            emoji: '☀️',
            widget: {
              template: 'graph',
              parameters: {
                xAxisLabel: 'Month of the Year',
                yAxisLabel: 'Sun Angle (degrees above horizon)',
                explanation: 'In fact, Earth is closest to the Sun (perihelion) in early January, right in the middle of Northern winter!'
              }
            }
          },
          interaction: {
            type: 'choice',
            prompt: 'In early January, Earth is at its closest point to the Sun. Yet India has chilly winter. What does this prove?',
            options: [
              'Seasons cannot be caused by distance from the Sun',
              'The Sun loses heat in January',
              'Earth’s atmosphere freezes in January'
            ],
            correctAnswer: 'Seasons cannot be caused by distance from the Sun',
            explanation: 'Being closest to the Sun during winter proves distance is NOT the cause of seasons!',
            reactionCorrect: 'Spot on! Distance changes are tiny (about 3%) and have almost no effect compared to tilt.',
            reactionIncorrect: 'Think carefully: if being closer caused summer, January would be our hottest month, but it is winter in India!'
          }
        },
        {
          sceneNumber: 3,
          header: 'The Flashlight and the Angle',
          text: 'Her science teacher, Mrs. Sharma, darkened the room and shined a flashlight straight at a desk. A tiny, bright, concentrated circle appeared. Then she tilted the flashlight: the same light spread out into an elongated, weaker oval.',
          visual: {
            type: 'widget',
            illustrationPrompt: 'Hands holding a flashlight shining beam onto grid paper: direct intense circle vs slanted spread-out beam',
            emoji: '🔦',
            widget: {
              template: 'slider',
              parameters: {
                label: 'Sunlight Concentration Factor',
                unit: 'W/m²',
                min: 200,
                max: 1000,
                defaultValue: 850,
                explanation: 'Direct overhead sunlight concentrates heat over a smaller area; slanted sunlight spreads heat thinly.'
              }
            }
          },
          interaction: {
            type: 'predict',
            prompt: 'In June, the Northern Hemisphere is tilted TOWARD the Sun. How do sunbeams strike India?',
            options: [
              'More directly overhead, concentrating energy and causing longer days',
              'At a low slanted angle with short days',
              'Completely sideways'
            ],
            correctAnswer: 'More directly overhead, concentrating energy and causing longer days',
            explanation: 'When tilted toward the Sun, light hits nearly perpendicular and days are longer, heating up the land.',
            reactionCorrect: 'Exactly right! Direct sunlight + longer daylight hours = summer warmth!',
            reactionIncorrect: 'When your hemisphere leans toward the Sun, sunlight strikes directly from high overhead!'
          }
        },
        {
          sceneNumber: 4,
          header: 'The Cosmic Dance',
          text: 'Tara sighed with awe. “Because of a 23.5-degree tilt billions of years ago, we get monsoons, harvests, snow, and golden mangoes!” She texted Leo: “Hang in there with your blanket—your turn for sunshine is in December!”',
          visual: {
            type: 'illustration',
            illustrationPrompt: 'Earth floating in space with visible axial tilt line and sunny glow on northern hemisphere',
            emoji: '🌍',
            widget: {
              template: 'none',
              parameters: {}
            }
          },
          interaction: null
        }
      ]
    },
    quiz: {
      topic: 'Why do we have seasons?',
      conceptId: 'why-do-we-have-seasons',
      level: 'Intermediate',
      isTeacherVerified: true,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          prompt: 'What is the primary cause of Earth’s seasons?',
          options: [
            'The 23.5° tilt of Earth’s rotation axis as it orbits the Sun',
            'Changes in the distance between Earth and the Sun',
            'Variations in solar flares and sunspots',
            'Speed changes of Earth in space'
          ],
          correctAnswer: 'The 23.5° tilt of Earth’s rotation axis as it orbits the Sun',
          misconceptionTarget: 'Believing distance from the Sun causes seasons',
          rubric: 'Earth’s axial tilt causes each hemisphere to lean toward or away from the Sun during orbit.'
        },
        {
          id: 'q2',
          type: 'prediction',
          prompt: 'If Earth’s axis were perfectly perpendicular (0° tilt) to its orbit, what would happen to seasons?',
          options: [
            'There would be virtually no seasonal changes throughout the year',
            'Summers would become twice as hot',
            'The entire planet would freeze permanently'
          ],
          correctAnswer: 'There would be virtually no seasonal changes throughout the year',
          misconceptionTarget: 'Not understanding that axial tilt creates seasonal variation',
          rubric: 'Without tilt, every day would have 12 hours of light with unchanging solar angles everywhere.'
        },
        {
          id: 'q3',
          type: 'application',
          prompt: 'When it is mid-summer in New Delhi (Northern Hemisphere), what season is it in Sydney, Australia (Southern Hemisphere)?',
          options: ['Winter', 'Summer', 'Spring', 'Autumn'],
          correctAnswer: 'Winter',
          misconceptionTarget: 'Believing the whole planet shares the same season simultaneously',
          rubric: 'When the Northern hemisphere tilts toward the Sun, the Southern tilts away, producing winter.'
        },
        {
          id: 'q4',
          type: 'short_answer',
          prompt: 'What astronomical term refers to the two days in the year when day and night are of equal duration worldwide?',
          acceptableKeywords: ['equinox', 'equinoxes'],
          misconceptionTarget: 'Confusing solstice with equinox',
          rubric: 'The equinox (around March 21 and September 23) has equal day and night length.'
        },
        {
          id: 'q5',
          type: 'in_your_own_words',
          prompt: 'Explain why slanted sunlight in winter feels cooler than direct overhead sunlight in summer.',
          acceptableKeywords: ['spread', 'area', 'concentrated', 'angle', 'energy', 'surface'],
          misconceptionTarget: 'Thinking summer sunbeams are physically hotter photons rather than more concentrated',
          rubric: 'Slanted light spreads the same amount of solar heat over a much larger surface area, diluting the warmth.'
        }
      ]
    },
    corrective: {
      title: 'The Magnifying Glass Riddle',
      concept: 'Axial Tilt vs Distance',
      targetedMisconception: 'Believing summer happens because Earth is closer to the Sun.',
      scenes: [
        {
          header: 'The Flashlight Test',
          text: 'Shine a torch straight down on paper: you see a small, blinding circle. Now tilt the torch: the light spreads into a faint oval covering twice the area. The amount of light is identical, but its concentration changes!',
          visualEmoji: '🔦'
        },
        {
          header: 'The January Fact',
          text: 'Earth is actually 5 million kilometers CLOSER to the Sun in January than in July. Yet January is chilly winter in India, because the northern hemisphere is tilted away from the sun!',
          visualEmoji: '❄️'
        }
      ],
      takeaway: 'Seasons are driven by Earth’s 23.5° axial tilt which changes the angle and duration of sunlight, NOT by distance to the Sun.',
      recheckQuestions: [
        {
          prompt: 'During Indian summer in June, is the Northern Hemisphere tilted toward or away from the Sun?',
          options: ['Toward the Sun', 'Away from the Sun'],
          correctAnswer: 'Toward the Sun',
          explanation: 'Tilted toward the Sun gives direct rays and longer daylight hours.'
        }
      ]
    }
  }
};
