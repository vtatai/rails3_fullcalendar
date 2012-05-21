$(document).ready(function() {

  var date = new Date();
  var d = date.getDate();
  var m = date.getMonth();
  var y = date.getFullYear();

  var onMouseoverEvent = function(me, event) {
    if (isEditable(event)) {
      /*
      *	SHOW DELETE ICON, ALSO POSSIBLE TO SHOW AN EDIT ICON HERE
      */
      var layer = 
      '<div id="events-layer" class="fc-transparent" style="position:absolute; width:100%; height:100%; top:-1px; text-align:right; z-index:100">' +
        '<a><img src="images/delete.png" title="delete" width="14" id="delbut'+event.id+'" border="0" style="padding-right:5px; padding-top:2px;" /></a>' +
        '</div>';

      me.append(layer);
      $("#delbut"+event.id).hide();
      $("#delbut"+event.id).fadeIn(200);
      $("#delbut"+event.id).click(function() {
        if(event.id) {
          $.destroy({
            url:"/events/" + event.id,
            success:function(html){
              $('#calendar').fullCalendar('removeEvents', event.id);
            },
            error: function(xhr, headers) {
              alert('An error occurred while communicating with the server, please try again');
            }
          });
        }
      });
    }
  };

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
      return false;
    },

    dayClick: function(date, allDay, jsEvent, view) {
      if (allDay) {
        openEventDialog(date, allDay);
      } else {
        alert('Unsupported');
      }
    },

    eventMouseover: function(event, jsEvent, view) {
      onMouseoverEvent($(this), event);
    },

    eventMouseout: function(calEvent, domEvent) {
      $("#events-layer").remove();
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
  $('#all_day').change(function() {
    checked = $(this).is(':checked');
    if (checked) {
      disableDialogTimeFields();
    } else {
      enableDialogTimeFields();
    }
  });
});

function disableDialogTimeFields() {
  $('#start_time').val('');
  $('#end_time').val('');
  $('#start_time').attr('disabled', 'true');
  $('#end_time').attr('disabled', 'true');
}

function enableDialogTimeFields() {
  $('#start_time').removeAttr('disabled');
  $('#end_time').removeAttr('disabled');
  $('#start_time').val('10:00');
  $('#end_time').val('11:00');
}

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
    disableDialogTimeFields();
  } else {
    $('#all_day').attr('checked', false);
    enableDialogTimeFields();
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
    event.start.setHours(startTime.getHours());
    event.start.setMinutes(startTime.getMinutes());

    endTime = Date.parseFormat($('#end_time').val(), 'HH:mm');
    if (!validateDate(endTime)) return;
    event.end.setHours(endTime.getHours());
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

function isEditable(event) {
  return event.editable || (event.source || {}).editable || $('#calendar').data('fullCalendar').options['editable'];
}
