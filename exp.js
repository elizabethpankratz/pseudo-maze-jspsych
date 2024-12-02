// Illustration of the pseudo-maze task in jsPsych 7
// Elizabeth Pankratz, December 2024


var jsPsych = initJsPsych({
  message_progress_bar: 'Progress',
  on_finish: function() {
    jsPsych.data.displayData('csv');
  },
  show_progress_bar: true,
  auto_update_progress_bar: true
});


var intro = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `<p>On the next screen, the pseudo-maze task will begin.</p>
  <p>Press "e" with your left hand to choose the syllable on the left, or press "i" with your right hand to choose the syllable on the right.</p>
  <p>If you choose wrong, you'll get to redo the same trial until you choose correctly.</p>
  `,
  choices: ["Continue"],
};


// ==========================================================================================
// The following code is modified from James Brand
// https://github.com/jamesbrandscience/maze-jspsych 
// ==========================================================================================

var maze_trial = {
  type: jsPsychMazeKeyboard,
  on_start: function(data) {
    // shuffles order of target and distractor
      var random1 = jsPsych.randomization.shuffle([
          jsPsych.timelineVariable('Target'),
          jsPsych.timelineVariable('Distractor')
      ]);
      data.stimulus_left = random1[0];
      data.stimulus_right = random1[1];
      data.Target = jsPsych.timelineVariable('Target');
      data.Distractor = jsPsych.timelineVariable('Distractor');
  },
  choices: ["e", "i"],
  on_finish: function() {
      var data = jsPsych.data.get().last(1).values()[0];
      if (jsPsych.pluginAPI.compareKeys(data.stimulus_left,
              data.Target) &&
          data.response == "e") {
          data.correct = 1;
      } else if (jsPsych.pluginAPI.compareKeys(data.stimulus_right,
              data.Target) &&
          data.response == "i") {
          data.correct = 1;
      } else {
          data.correct = 0;
      };
      data.Syll_num = jsPsych.timelineVariable('Syll_num');
      data.Word_idx = jsPsych.timelineVariable('Word_idx');
      data.task = "maze";
  }
};
var error_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p style='color: red; font-size: 24pt;'>x</p>",
  choices: "NO_KEYS",
  trial_duration: 350,
  on_finish: function(data){
    data.task = "maze_error";
    data.Word_idx = jsPsych.timelineVariable('Word_idx');
  }
};
function key_check() {
  var data = jsPsych.data.get().last(1).values()[0];
  if (jsPsych.pluginAPI.compareKeys(data.stimulus_left,
          data.Target) &&
      data.response == "e") {
      return false;
  } else if (jsPsych.pluginAPI.compareKeys(data.stimulus_right,
          data.Target) &&
      data.response == "i") {
      return false;
  } else {
      return true;
  }
};
var if_node = {
  timeline: [error_trial],
  conditional_function: key_check
};
var loop_node = {
  timeline: [maze_trial, if_node],
  loop_function: key_check
};


// ==========================================================================================
// Build the actual pseudo-maze trials
// ==========================================================================================

// Define accumulator that'll contain the objects for all pseudo-maze trials.
var all_mazes = [];

// Define the words that'll be tested.
all_maze_words = [
  // first word
  [
    {
      Target: 'ne',
      Distractor: 'xx',
      Syll_num: 0,
      Word_idx: 0
    },
    {
      Target: 'frud',
      Distractor: 'jok',
      Syll_num: 1,
      Word_idx: 0
    },

    {
      Target: 'pu',
      Distractor: 'bo',
      Syll_num: 2,
      Word_idx: 0
    },
  ],
  // second word
  [
    {
      Target: 'zu',
      Distractor: 'xx',
      Syll_num: 0,
      Word_idx: 1
    },
    {
      Target: 'hul',
      Distractor: 'loth',
      Syll_num: 1,
      Word_idx: 1
    },

    {
      Target: 'ne',
      Distractor: 'mi',
      Syll_num: 2,
      Word_idx: 1
    },
  ], 
]


// For each word, generate the maze_sequence (target vs. distrator, one syllable at a time)
// and the target_display_trial, where the full word is displayed for 1000ms.
for(let curr_idx in all_maze_words){
  var curr_maze_wd = all_maze_words[Number(curr_idx)]

  // Create maze part of trial
  var maze_sequence = {
    timeline: [loop_node],
    timeline_variables: curr_maze_wd
  };

  // Concat target syllables together and create the target display part of trial
  // (shows the whole word in green once it's been constructed correctly)
  var target_string = curr_maze_wd.map(e => e['Target']).join('')
  var target_display_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p style='color: forestgreen; font-size: 24pt;'>${target_string}</p>`,
    choices: "NO_KEYS",
    trial_duration: 1000,
    data: {
      Target: target_string,
    }
  }

  // Add both components to accumulator.
  all_mazes.push(maze_sequence, target_display_trial)
};


// Assemble timeline and run.
var timeline = [].concat(
  intro,
  all_mazes
).flat();

jsPsych.run(timeline)
