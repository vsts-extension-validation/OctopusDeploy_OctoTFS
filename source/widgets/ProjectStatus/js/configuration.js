function OctopusStatusWidgetConfiguration() {
    this.Configure = function (WidgetHelpers, VSS_Auth_Service) {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.register("OctoProjectEnvironmentWidget.Configuration", function () {
            var $connectionDropdown = $("#octopus-connection");
            var $spaceDropdown = $("#octopus-space");
            var $projectDropdown = $("#octopus-project");
            var $environmentDropdown = $("#octopus-environment");

            // Saving Settings
            var saveSettings = function (configurationContext, connectionId, spaceId, spaceName, projectId, projectName, environmentId, environmentName) {
                console.debug('Saving settings - Connection: ' + connectionId + ', Space: ' + spaceId + ', Project: ' + projectId + ', Environment: ' + environmentId);
                var customSettings = {
                    data: JSON.stringify({
                        connectionId: connectionId,
                        spaceId: spaceId,
                        spaceName: spaceName,
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
            };

            var fetchDataSourceContent = function (queryUri, token, name, spaceId) {

                let query;

                if (spaceId){
                    query = '{"dataSourceDetails": {"dataSourceName":"' + name + '", "parameters": {"SpaceId":"' + spaceId + '"} } }';
                }
                else {
                    query = '{"dataSourceDetails": {"dataSourceName":"' + name + '"}}';
                }

                return $.ajax({
                    type: "POST",
                    url: queryUri,
                    data: query,
                    contentType: 'application/json',
                    dataType: 'json',
                    headers: {'Authorization': token}
                });

            };

            var appendDropdownOptions = function ($element, resultSelector, idSelector, nameSelector, selection) {
                return function (data) {

                    //A failed data source request will come back as okay but with an associated error message.
                    if (data.errorMessage) {
                        console.error(data.errorMessage);
                        return;
                    }
                    var selected = selection;
                    resultSelector(data).forEach(function (result) {
                        if (!selected) {
                            selected = idSelector(result);
                        }

                        $element.append($('<option value="' + idSelector(result) + '">' + nameSelector(result) + '</option>'));
                    });

                    $element.val(selected);
                }
            };

            var selectId = function (val) {
                if (!val) {
                    return null;
                }
                return val.id ? val.id : val.Id;
            };

            var selectName = function (val) {
                if (!val) {
                    return null;
                }

                return val.name ? val.name : val.Name;
            };

            var prop = function (name) {
                return function (val) {
                    if (val) {
                        return val[name];
                    }
                    return null;
                }
            };

            var parseResult = function (data) {
                return (prop("result")(data) || []).map(JSON.parse);
            };

            var refreshSpacesProjectsAndEnvironmentsDropdowns = function (settings, queryUri, authToken) {

                $spaceDropdown.empty();
                $projectDropdown.empty();
                $environmentDropdown.empty();

                $.ajax({
                    type: "POST",
                    url: queryUri,
                    data: '{"dataSourceDetails": {"dataSourceName":"OctopusAllSpaces"}}',
                    contentType: 'application/json',
                    dataType: 'json',
                    headers: {'Authorization': authToken}
                }).done(function (data) {
                    var hasSpaces = !data.errorMessage;

                    if (hasSpaces) {
                        // Spaces
                        var selectedSpaceId = settings ? settings.spaceId : null;

                        parseResult(data).forEach(function (result) {
                            if (!selectedSpaceId) {
                                selectedSpaceId = selectId(result);
                            }
                            $spaceDropdown.append($('<option value="' + selectId(result) + '">' + selectName(result) + '</option>'));
                        });

                        $spaceDropdown.val(selectedSpaceId);
                        console.log("Space ID: " + selectedSpaceId);

                        // $.ajax({
                        //     type: "POST",
                        //     url: queryUri,
                        //     data: '{"dataSourceDetails": {"dataSourceName":"OctopusAllProjectsInSpace", "parameters":{"SpaceId": "' + selectedSpaceId + '"}}}',
                        //     contentType: 'application/json',
                        //     dataType: 'json',
                        //     headers: {'Authorization': authToken}
                        // }).done( function(projectData) {
                        //
                        //     var selectedProjectId = settings ? settings.projectId : null;
                        //
                        //     if (projectData.errorMessage) {
                        //         console.error(projectData.errorMessage);
                        //     }
                        //
                        //     parseResult(projectData).forEach(function (projectDataItem) {
                        //         if (!selectedProjectId) {
                        //             selectedProjectId = selectId(projectDataItem);
                        //         }
                        //         $projectDropdown.append($('<option value="' + selectId(projectDataItem) + '">' + selectName(projectDataItem) + '</option>'));
                        //     });
                        //
                        //     $projectDropdown.val(selectedProjectId);
                        //     console.log("Project ID: " + selectedProjectId);
                        // });
                        //
                        // $.ajax({
                        //     type: "POST",
                        //     url: queryUri,
                        //     data: '{"dataSourceDetails": {"dataSourceName":"OctopusAllEnvironmentsInSpace", "parameters":{"SpaceId": "' + selectedSpaceId + '"}}}',
                        //     contentType: 'application/json',
                        //     dataType: 'json',
                        //     headers: {'Authorization': authToken}
                        // }).done( function(environmentData) {
                        //
                        //     var selectedEnvironmentId = settings ? settings.environmentId : null;
                        //
                        //     if (environmentData.errorMessage) {
                        //         console.error(environmentData.errorMessage);
                        //     }
                        //
                        //     parseResult(environmentData).forEach(function (environmentDataItem) {
                        //         if (!selectedEnvironmentId) {
                        //             selectedEnvironmentId = selectId(environmentDataItem);
                        //         }
                        //         $environmentDropdown.append($('<option value="' + selectId(environmentDataItem) + '">' + selectName(environmentDataItem) + '</option>'));
                        //     });
                        //
                        //     $environmentDropdown.val(selectedEnvironmentId);
                        //     console.log("Environment ID: " + selectedEnvironmentId);
                        // });

                        // Projects
                        var appendProjectData = appendDropdownOptions($projectDropdown, parseResult, selectId, selectName, settings ? settings.projectId : null);
                        fetchDataSourceContent(queryUri, authToken, "OctopusAllProjectsInSpace", selectedSpaceId).done(appendProjectData);

                        // Environments
                        var appendEnvironmentData = appendDropdownOptions($environmentDropdown, parseResult, selectId, selectName, settings ? settings.environmentId : null);
                        fetchDataSourceContent(queryUri, authToken, "OctopusAllEnvironmentsInSpace", selectedSpaceId).done(appendEnvironmentData);

                    } else {
                        // No Spaces

                        // Projects
                        var appendProjectData = appendDropdownOptions($projectDropdown, parseResult, selectId, selectName, settings ? settings.projectId : null);
                        fetchDataSourceContent(queryUri, authToken, "OctopusAllProjects", null).done(appendProjectData);

                        // Environments
                        var appendEnvironmentData = appendDropdownOptions($environmentDropdown, parseResult, selectId, selectName, settings ? settings.environmentId : null);
                        fetchDataSourceContent(queryUri, authToken, "OctopusAllEnvironments", null).done(appendEnvironmentData);
                    }

                });
            };

            var refreshProjectsAndEnvironmentsInSpaceDropdowns = function (settings, queryUri, authToken, spaceId) {
                $projectDropdown.empty();
                $environmentDropdown.empty();

                // Projects
                var appendProjectData = appendDropdownOptions($projectDropdown, parseResult, selectId, selectName, settings ? settings.projectId : null);
                fetchDataSourceContent(queryUri, authToken, "OctopusAllProjectsInSpace", spaceId)
                    .done(appendProjectData);

                // Environments
                var appendEnvironmentData = appendDropdownOptions($environmentDropdown, parseResult, selectId, selectName, settings ? settings.environmentId : null);
                fetchDataSourceContent(queryUri, authToken, "OctopusAllEnvironmentsInSpace", spaceId)
                    .done(appendEnvironmentData);
            };

            var getConnectionQueryUri = function (baseUri, $element) {
                return function () {
                    var result = baseUri + '/_apis/distributedtask/serviceendpointproxy?endpointId=' + $element.val() + '&api-version=3.0-preview.1';
                    return result;
                }
            };

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
                            headers: {'Authorization': authToken}
                        })
                            .done(function (data) {

                                appendDropdownOptions($connectionDropdown, prop("value"), selectId, selectName, settings ? settings.connectionId : null)(data);
                                var queryUri = getConnectionQueryUri(baseUri, $connectionDropdown);
                                refreshSpacesProjectsAndEnvironmentsDropdowns(settings, queryUri(), authToken);

                                $connectionDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                    refreshSpacesProjectsAndEnvironmentsDropdowns(settings, queryUri(), authToken);
                                });

                                $spaceDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                    refreshProjectsAndEnvironmentsInSpaceDropdowns(settings, queryUri(), authToken, $spaceDropdown.val());
                                });

                                $projectDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                });

                                $environmentDropdown.on("change", function () {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                });

                                //init the widget with initial settings as these values don't exist yet.
                                if (!settings) {
                                    saveSettings(widgetConfigurationContext, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                                }

                                return WidgetHelpers.WidgetStatusHelper.Success();
                            });
                    });
                },
                onSave: function () {
                    var customSettings = saveSettings(null, $connectionDropdown.val(), $spaceDropdown.val(), $(':selected', $spaceDropdown).text(), $projectDropdown.val(), $(':selected', $projectDropdown).text(), $environmentDropdown.val(), $(':selected', $environmentDropdown).text());
                    return WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
                }
            }
        });
        VSS.notifyLoadSucceeded();
    }
};