$(document).ready(function() {

  var date = new Date();
  var d = date.getDate();
  var m = date.getMonth();
  var y = date.getFullYear();

  $('#calendar').fullCalendar({
    editable: true,        
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    defaultView: 'month',
    height: 500,
    slotMinutes: 15,

    loading: function(bool){
      if (bool) 
        $('#loading').show();
      else 
        $('#loading').hide();
    },

    // a future calendar might have many sources.        
    eventSources: [{
      url: '/events',
      color: 'yellow',
      textColor: 'black',
      ignoreTimezone: false
    }],

    timeFormat: 'h:mm t{ - h:mm t} ',
    dragOpacity: "0.5",

    //http://arshaw.com/fullcalendar/docs/event_ui/eventDrop/
    eventDrop: function(event, dayDelta, minuteDelta, allDay, revertFunc){
      updateEvent(event);
    },

    // http://arshaw.com/fullcalendar/docs/event_ui/eventResize/
    eventResize: function(event, dayDelta, minuteDelta, revertFunc){
      updateEvent(event);
    },

    // http://arshaw.com/fullcalendar/docs/mouse/eventClick/
    eventClick: function(event, jsEvent, view){
      // would like a lightbox here.
    },

    dayClick: function(date, allDay, jsEvent, view) {
      if (allDay) {
        openEventDialog(date, allDay);
      } else {
        alert('Unsupported');
      }
    }
  });
  $('#all_day_dialog').dialog({
    title: 'New Event',
    autoOpen: false,
    buttons: {
      'Cancel': function() { $(this).dialog('close'); },
      'Create': function() { createEventFromDialog(); }
    }
  });
});

function updateEvent(the_event) {
  $.update(
    "/events/" + the_event.id,
    { event: { title: the_event.title,
      starts_at: "" + the_event.start,
      ends_at: "" + the_event.end,
      description: the_event.description
    }
    },
    function (reponse) { alert('successfully updated task.'); }
  );
}

function openEventDialog(date, allDay) {
  $('#start_date').val(date.dateFormat('DD/MM'));
  $('#end_date').val(date.dateFormat('DD/MM'));
  if (allDay) {
    $('#all_day').attr('checked', true);
    $('#start_time').val('');
    $('#end_time').val('');
    $('#start_time').attr('disabled', 'true');
    $('#end_time').attr('disabled', 'true');
  } else {
    $('#all_day').attr('checked', false);
    $('#start_time').val(date.timeFormat('HH:mm'));
    $('#end_time').val(date.timeFormat('HH:mm'));
    $('#start_time').removeAttr('disabled');
    $('#end_time').removeAttr('disabled');
  }
  $('#what').val('');
  $('#all_day_dialog').dialog('open');
}

function createEventFromDialog() {
  allDay = $('#all_day').is(':checked');

  event = {};
  
  event.start = Date.parseFormat($('#start_date').val(), 'DD/MM');
  if (!validateDate(event.start)) return;
  event.start.setFullYear($('#calendar').fullCalendar('getDate').getFullYear());
  
  event.end = Date.parseFormat($('#end_date').val(), 'DD/MM');
  if (!validateDate(event.end)) return;
  event.end.setFullYear($('#calendar').fullCalendar('getDate').getFullYear());

  if (allDay) {
    event.allDay = true;
  } else {
    event.allDay = false;

    startTime = Date.parseFormat($('#start_time').val(), 'HH:mm');
    if (!validateDate(startTime)) return;
    event.start.setHour(startTime.getHour());
    event.start.setMinutes(startTime.getMinutes());

    endTime = Date.parseFormat($('#end_time').val(), 'HH:mm');
    if (!validateDate(endTime)) return;
    event.end.setHour(endTime.getHour());
    event.end.setMinutes(endTime.getMinutes());
  }
  event.title = $('#what').val();
  createEvent(event, function() {
    $('#all_day_dialog').dialog('close');
    $('#calendar').fullCalendar('refetchEvents');
    $('#calendar').fullCalendar('rerenderEvents');
  });
}

function createEvent(the_event, successCallback) {
  $.create(
    "/events",
    { event: { title: the_event.title,
      starts_at: "" + the_event.start,
      ends_at: "" + the_event.end,
      description: the_event.description,
      all_day: "" + the_event.allDay
    }},
    function (response) {
      successCallback();
    },
    function (response) {
      alert('error');
    }
  );
}

function validateDate(date) {
  if (date === null) {
    alert('Please use the correct format for the date');
    return false;
  }
  return true;
}
