class Time {
  constructor(ms) {
    if (ms) {
      if (ms < 0) {
        ms = -ms;
        this.isNegative = true;
      } else this.isNegative = false;
      this.h = Math.floor(ms / (1000 * 60 * 60));
      ms = ms % (1000 * 60 * 60);
      this.m = Math.floor(ms / (1000 * 60));
      ms = ms % (1000 * 60);
      this.s = Math.floor(ms / 1000);
      this.ms = ms % 1000;
    } else {
      this.h = 0;
      this.m = 0;
      this.s = 0;
      this.ms = 0;
      this.isNegative = false;
    }
  }

  compare(time) {
    return this.toMsecs() - time.toMsecs();
  }

  sum(time) {
    let newTime = new Time();
    newTime.ms += this.ms + time.ms
    if (newTime.ms > 999)  {
      newTime.s++;
      newTime.ms -= 1000;
    }
    newTime.s += this.s + time.s;
    if (newTime.s > 59)  {
      newTime.m++;
      newTime.s -= 60;
    }
    newTime.m += this.m + time.m;
    if (newTime.m > 59)  {
      newTime.h++;
      newTime.m -= 60;
    }
    newTime.h += this.h + time.h;
    return newTime;
  }

  toMsecs() {
    return this.h * 1000 * 60 * 60 + this.m * 1000 * 60 + this.s * 1000 + this.ms;
  }

  subtract(time) {
    return new Time(this.toMsecs() - time.toMsecs());
  }

  add(time) {
    let newTime = new Time(this.toMsecs() + time.toMsecs());
    this.h = newTime.h;
    this.m = newTime.m;
    this.s = newTime.s;
    this.ms = newTime.ms;
  }

  increment(inc) {
    this.ms += inc;
    if (this.ms > 999) {
      this.ms = 0;
      this.s++;
    }
    if (this.s > 59) {
      this.s = 0;
      this.m++;
    }
    if (this.m > 59) {
      this.m = 0;
      this.h++;
    }
  }

  toString(fill, addSign) {
    let mins = (this.m >= 10 ? this.m + '': '0' + this.m);
    let secs = (this.s >= 10 ? this.s + '': '0' + this.s);
    let msecs = '';
    if (this.ms < 100) msecs += '0';
    if (this.ms < 10) msecs += '0';
    msecs += this.ms;
    if (fill) return this.h + ':' + mins + ':' + secs + ':' + msecs;
    if(this.h > 0) return (addSign ? (this.isNegative ? '-' : '+') : '') + this.h + ':' + mins + ':' + secs + '.' + Math.floor(this.ms / 100);
    if (mins > 0) return (addSign ? (this.isNegative ? '-' : '+') : '') + this.m + ':' + secs + '.' + Math.floor(this.ms / 100);
    return (addSign ? (this.isNegative ? '-' : '+') : '') + this.s + '.' + Math.floor(this.ms / 100);
  }
};
class SplitData {
  constructor() {
    this.game = 'Game';
    this.category = 'Category';
    this.splits = [{ name: '1st Split', pb: 0, best: 0 }];
  }
}
let splitData = new SplitData();
let categorySelection = false;
let running = false;
let time = new Time();
let curSplit = 0;
let splits;
let segTime = new Time();
let times = [];

function download(filename, contents) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(contents));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function createSplit(split) {
  let li = document.createElement('li');
  let data = document.createElement('div');
  let name = document.createElement('div');
  let nameMsg = document.createElement('h2');
  let best = document.createElement('h3');
  let timer = document.createElement('div');
  let button = document.createElement('i');

  li.className = 'split';
  data.className = 'split-data';
  name.className = 'split-name';
  nameMsg.className = 'msg-target';
  nameMsg.innerHTML = split.name;
  button.className = 'fas fa-pencil-alt split-edit';
  best.className = 'split-best';
  best.innerHTML = 'PB Time: ' + (split.pb > 0 ? new Time(split.pb).toString(false): '-');
  timer.className = 'time';

  name.appendChild(nameMsg);
  name.appendChild(button);
  data.appendChild(name);
  data.appendChild(best);
  li.appendChild(data);
  li.appendChild(timer);

  return li;
}

function updateSplits() {
  console.log(splitData);
  $('#title .msg-target').html(splitData.game);
  $('#category .msg-target').html(splitData.category);
  time = new Time();
  $('#time').html(time.toString(true));
  $('#splits').html('');
  for (let split of splitData.splits) document.getElementById('splits').appendChild(createSplit(split));
  splits = document.getElementsByClassName('split');
}

function readFile(file) {
  return new Promise(
    resolve => {
      let res;
      const fileReader = new FileReader();

      $('#spinner').css('display', 'block');

      fileReader.addEventListener('load', (event) => {
        res = event.target.result;
      });

      fileReader.addEventListener('progress', (event) => {
          if (event.loaded == event.total) {
            window.setTimeout(() => {
              resolve(res);
            }, 2000);
          }
      });

      fileReader.readAsText(event.target.files[0]);
    }
  )
}

async function readSplit(file) {
  let valid = false;
  const data = await readFile(file);

  try {
    const splits = JSON.parse(data);
    if (splits.game) {
      valid = true;
    }
  } catch(error) {}

  if (valid) {
    splitData = JSON.parse(data);
    updateSplits();
  } else {
    $('#container').append(`<div class="error">Unable to load split</div>`);
    window.setTimeout(() => {
      $('.error').fadeOut('fast', () => {
        $('.error').remove();
      });
    }, 3000);
  }
  $('#spinner').css('display', 'none');
  $('#focus').focus();
}

function split() {
  if (!splitData) return;
  if (!running) {
    running = true;
    time = new Time();
    times = [];
    for (let split of splits) split.children[1].className = 'time';
    $('#time').attr('class', '');
  } else {
    if (segTime.compare(new Time(splitData.splits[curSplit].best)) < 0 || splitData.splits[curSplit].best <= 0) {
      splitData.splits[curSplit].best = segTime.toMsecs();
      splits[curSplit].children[1].className = 'time gold';
    }
    curSplit++;
    times.push(time.toMsecs());
    segTime = new Time();
  }
  if (curSplit >= splits.length) {
    running = false;
    if (time.compare(new Time(splitData.splits[curSplit - 1].pb)) < 0 || splitData.splits[curSplit - 1].pb == 0) {
      for (let i = 0; i < splitData.splits.length; i++) splitData.splits[i].pb = times[i];
      $('#time').toggleClass('blue');
    }
    curSplit = 0;
  }
}

$(document).ready(() => {
  updateSplits();
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
    $(document).on('click', (event) => {
      if (event.target.localName != 'button') split();
    });
  } else {
    $(document).on('keydown', (event) => {
      if (event.keyCode == 32) split();
    });
  }
  window.setInterval(() => {
    if (running) {
      time.increment(21);
      segTime.increment(21);
      $('#time').html(time.toString(true));

      splits[curSplit].children[1].innerHTML = time.subtract(new Time(splitData.splits[curSplit].pb)).toString(false, splitData.splits[curSplit].pb > 0);
      if (splits[curSplit].children[1].innerHTML.includes('-')) splits[curSplit].children[1].className = 'time green';
      else if (splits[curSplit].children[1].innerHTML.includes('+')) splits[curSplit].children[1].className = 'time red';
      // Find Sum of Best
      let sum = new Time();
      for (let split of splitData.splits) sum.add(new Time(split.best));
      $('#sb').html(sum.toString(false));
    }
  }, 21);

  $('#file-loader').on('change', (event) => {
    readSplit(event.target.files[0]);
  });
  $('#load').on('mousedown', (event) => {
    $('#file-loader').trigger('click');
  });
  $('#download').on('click', (event) => {
    if (splitData) {
      splitData.game = $('#title .msg-target').html();
      splitData.category = $('#category .msg-target').html();
      for (let i = 0; i < splitData.splits.length; i++) {
        splitData.splits[i].name = splits[i].children[0].children[0].children[0].innerHTML;
      }
      download('split.json', JSON.stringify(splitData));
    }
  });
  $('#container').on('click', '.error', (event) => {
    $(event.target).fadeOut('fast');
  });
  $('.fa-pencil-alt').on('click', (event) => {
    console.log(event);
    $(event.target.parentElement.children[0]).attr('contenteditable', (index, attr) => {
      console.log(attr);
      return attr != 'true' ? 'true' : 'false';
    });
  });
});
