function OctopusStatusWidgetConfiguration() {
    this.Configure = function (WidgetHelpers, VSS_Auth_Service) {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.register("OctoProjectEnvironmentWidget.Configuration", function () {
            var $connectionDropdown = $("#octopus-connection");
            var $projectDropdown = $("#octopus-project");
            var $environmentDropdown = $("#octopus-environment");

            // Saving Settings
            var saveSettings = function (configurationContext, connectionId, projectId, projectName, environmentId, environmentName) {
                console.debug('Saving settings - Connection: ' + connectionId + ', Project: ' + projectId + ', Environment: ' + environmentId);
                var customSettings = {
                    data: JSON.stringify({
                        connectionId: connectionId,
                        projectId: projectId,
                        projectName: projectName,
                        environmentId: environmentId,
                        environmentName: environmentName
                    })
                };

                if (configurationContext) {
                    var eventName = WidgetHelpers.WidgetEvent.ConfigurationChange;
                    var eventArgs = WidgetHelpers.WidgetEvent.Args(customSettings);
                    configurationContext.notify(eventName, eventArgs);
                }
                return customSettings;
            }

            return {
                load: function (widgetSettings, widgetConfigurationContext) {
                    var settings = JSON.parse(widgetSettings.customSettings.data);

                    VSS.getAccessToken().then(function (token) {
                        var webContext = VSS.getWebContext();
                        var baseUri = webContext.collection.uri + "/" + webContext.project.name;
                        var endpointUri = baseUri + '/_apis/distributedtask/serviceendpoints?type=OctopusEndpoint&api-version=3.0-preview.1';

                        var authToken = VSS_Auth_Service.authTokenManager.getAuthorizationHeader(token);

                        $.ajax({
                            type: "GET",
                            url: endpointUri,
                            headers: { 'Authorization': authToken }
                        })
                            .done(function (data) {
                                $(data.value).each(function (i, e) {
                                    console.debug(e);
                                    $connectionDropdown.append($('<option value="' + e.id + '">' + e.name + '</option>'));
                                });
                                if (settings && settings.connectionId) {
                                    $connectionDropdown.val(settings.connectionId);
                                }

                                var queryUri = baseUri + '/_apis/distributedtask/serviceendpointproxy?endpointId=' + $connectionDropdown.val() + '&api-version=3.0-preview.1';
                                var projectQueryContent = '{"dataSourceDetails": {"dataSourceName":"OctopusAllProjects"}}';
                                $.ajax({
                                    type: "POST",
                                    url: queryUri,
                                    data: projectQueryContent,
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    headers: { 'Authorization': authToken }
                                })
                                    .done(function (data) {
                                        $(data.result).each(function (i, e) {
                                            var el = JSON.parse(e);
                                            $projectDropdown.append($('<option value="' + el.Id + '">' + el.Name + '</option>'));
                                        });
                                        if (settings && settings.projectId) {
                                            $projectDropdown.val(settings.projectId);
                                        }
                                    });

                                var environmentQueryContent = '{"dataSourceDetails": {"dataSourceName":"OctopusAllEnvironments"}}';
                                $.ajax({
                                    type: "POST",
                                    url: queryUri,
                                    data: environmentQueryContent,
                                    contentType: 'application/json',
                                    dataType: 'json',
                                    headers: { 'Authorization': authToken }
                                })
                                    .done(function (data) {
                                        $(data.result).each(function (i, e) {
                                            var el = JSON.parse(e);
                                            $environmentDropdown.append($('<option value="' + el.Id + '">' + el.Name + '</option>'));
                                        });
                                        if (settings && settings.environmentId) {
                                            $environmentDropdown.val(settings.environmentId);
                                        }
                                    });

                                $connectionDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                });
                                $projectDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                });
                                $environmentDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                });

                                return WidgetHelpers.WidgetStatusHelper.Success();
                            });
                    });
                },
                onSave: function () {
                    var customSettings = saveSettings(null, $connectionDropdown.val(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                    return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
                }
            }
        });
        VSS.notifyLoadSucceeded();
    }
};