;(function( $, window, document, undefined ) {

    $(document).ready(function() {

        if( $.fn.dialog ) {
            $("#mws-jui-dialog").dialog({
                autoOpen: false,
                title: "AJAX error",
                modal: true,
                width: "640",
                buttons: [{
                    text: "Reload Page",
                    click: function () {
                        location.reload();
                    }
                }]
            });
        }

        //noinspection JSUnresolvedVariable
        if( $.fn.spinner ) {
            $('.mws-spinner').spinner();
        }

        $('#button-to-home').on('click', function(event) {
            event.preventDefault();
            var url = $(this).data('target');
            location.replace(url);
        });

        // Declare variables
        var $wzd_form;
        var $wzd;
        var $tablesExist = false;
        var $adminUser = $("input[name=cfg__admin_user]").val();
        var $adminPass = $("input[name=cfg__admin_pass]").val();

        // Wait function
        $.wait = function(ms) {
            var defer = $.Deferred();
            setTimeout(function() { defer.resolve(); }, ms);
            return defer;
        };

        //
        if ($.fn.wizard) {

            if ($.fn.validate) {
                $wzd_form = $('.wzd-validate').validate({
                    rules: {
                        cfg__db_port: {
                            required: true,
                            min: 1,
                            max: 65535
                        }
                    },
                    onsubmit: false
                });

                $wzd = $('.wzd-validate').wizard({
                    orientation: 'horizontal',
                    buttonContainerClass: 'mws-button-row',
                    canNavigate: false,
                    onBeforeSubmit: function () {
                        return $wzd_form.form();
                    },
                    onStepLeave: function (wizard, step) {
                        return $wzd_form.form();
                    },
                    onStepShown: function (wizard, step) {

                        var i = step.index();
                        if (i > 2) {
                            wizard.prevButtonDisabled(true);
                            wizard.hideButtonRow(true);
                        }
                        if (i == 3) {
                            wizard.submitForm();
                        }
                        else if (i == 4 && !$tablesExist) {
                            // Re-log in here, incase user changed password
                            $.post( "/ASP/install/tables", { process: "installdb", action: "login", username: $adminUser, password: $adminPass })
                                .done(function( data ) {

                                    $.wait(500).then( function () {

                                        wizard.next();

                                        if (data.success == false) {
                                            $('#install-failed').show();
                                            $('#install-success').hide();
                                            $('#fail-message').html(data.message);
                                        }
                                    });
                                });
                        }
                    },
                    ajaxSubmit: true,
                    ajaxOptions: {
                        dataType: 'text',
                        beforeSubmit: function (formData) {
                            return true;
                        },
                        success: function (response, status, xhr, form) {
                            // Show my fancy loading form just a second longer...
                            $.wait(500).then( function () {
                                // Parse the JSON response
                                var result = jQuery.parseJSON(response);
                                if (result.success == true) {
                                    //noinspection JSUnresolvedVariable
                                    if (result.tablesExist) {
                                        // Go to first step
                                        form.wizard('skipNextPages', 2);
                                        $tablesExist = true;
                                    }
                                    else {
                                        form.wizard('next');
                                    }

                                    // Dont allow the user to backtrack now...
                                    form.wizard('forwardOnly', true);
                                }
                                else {
                                    form.wizard('prev');

                                    // Display error
                                    $('#ajax-message-1').html('<div class="alert error">' + result.message + '</div>');
                                }

                                // Update changes to admin username and password
                                $adminUser = $("input[name=cfg__admin_user]").val();
                                $adminPass = $("input[name=cfg__admin_pass]").val();
                                $("input[name=username]").val($adminUser);
                                $("input[name=password]").val($adminPass);
                            });
                        },
                        error: function(request, status, error) {
                            $("#mws-jui-dialog").html('<pre>' + request.responseText + '</pre>').dialog("open");
                        }
                    }
                });
            }
        }
    });
}) (jQuery, window, document);