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
      openEventDialogEvent(event);
      return false;
    },

    dayClick: function(date, allDay, jsEvent, view) {
      openEventDialogDate(date, allDay);
    },

    eventMouseover: function(event, jsEvent, view) {
      onMouseoverEvent($(this), event);
    },

    eventMouseout: function(calEvent, domEvent) {
      $("#events-layer").remove();
    }
  });
  $('#event_dialog').dialog({
    title: 'New Event',
    autoOpen: false,
    buttons: {
      'Cancel': function() { $(this).dialog('close'); },
      'Save': function() { saveEventFromDialog(); }
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

function enableDialogTimeFields(start, end) {
  $('#start_time').val(start ? start.timeFormat('HH:mm') : '10:00');
  $('#end_time').val(end ? end.timeFormat('HH:mm') : '11:00');
  $('#start_time').removeAttr('disabled');
  $('#end_time').removeAttr('disabled');
}

function openEventDialogEvent(event) {
  openEventDialog(event.id, event.start, event.end, event.allDay, event.title, event.description);
}

function openEventDialogDate(date, allDay) {
  openEventDialog(null, date, date, allDay, '', '');
}

function openEventDialog(event_id, start, end, allDay, title, description) {
  $('#event_id').val(event_id ? event_id : '');
  $('#start_date').val(start.dateFormat('DD/MM'));
  end = end ? end : start;
  $('#end_date').val(end.dateFormat('DD/MM'));
  if (allDay) {
    $('#all_day').attr('checked', true);
    disableDialogTimeFields();
  } else {
    $('#all_day').attr('checked', false);
    enableDialogTimeFields(start, end);
  }
  $('#what').val(title ? title : '');
  $('#description').val(description ? description : '');
  $('#event_dialog').dialog('open');
}

function saveEventFromDialog() {
  allDay = $('#all_day').is(':checked');

  event = {};

  event.id = $('#event_id').val();

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
  event.description = $('#description').val();

  if (event.id && event.id !== '') {
    updateEvent(event, closeAndReRenderDialog);
  } else {
    createEvent(event, closeAndReRenderDialog);
  }
}

function closeAndReRenderDialog() {
  $('#event_dialog').dialog('close');
  $('#calendar').fullCalendar('refetchEvents');
  $('#calendar').fullCalendar('rerenderEvents');
}

function updateEvent(the_event, successCallback, errorCallback) {
  successCallback = successCallback || function () {};
  errorCallback = errorCallback || function () {
      alert('An error occurred while updating the event, please refresh the page and try again'); 
  };
  $.update(
    "/events/" + the_event.id, { 
      event: { 
        title: the_event.title,
        starts_at: "" + the_event.start,
        ends_at: "" + the_event.end,
        description: the_event.description,
        all_day: "" + the_event.all_day
      }
    },
    function (response) { 
      successCallback(response);
    }, 
    function (response) {
      errorCallback(response);
    }
  );
}

function createEvent(the_event, successCallback, errorCallback) {
  successCallback = successCallback || function () {};
  errorCallback = errorCallback || function () {
      alert('An error occurred while creating the event, please refresh the page and try again'); 
  };
  $.create(
    "/events",
    { event: { title: the_event.title,
      starts_at: "" + the_event.start,
      ends_at: "" + the_event.end,
      description: '' + the_event.description,
      all_day: "" + the_event.allDay
    }},
    function (response) {
      successCallback(response);
    },
    function (response) {
      errorCallback(response);
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
