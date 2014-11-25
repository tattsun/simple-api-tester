/* @flow */

                 
                 
    function QueryModel() {"use strict";
        this.key = "";
        this.val = "";
    }
    QueryModel.prototype.Set=function(key         , val)          {"use strict";
        this.key = key;
        this.val = val;
    };
    QueryModel.prototype.GetKey=function()          {"use strict";
        return this.key;
    };
    QueryModel.prototype.GetValue=function()          {"use strict";
        return this.val;
    };


function QueryView(){"use strict";}
    QueryView.prototype.ShowQuery=function(position)          {"use strict";
        var keyinput = document.createElement('input');
        keyinput.setAttribute('type', 'text');
        keyinput.setAttribute('id', 'query-key-' + position);
        keyinput.setAttribute('size', '20');
        var valinput = document.createElement('input');
        valinput.setAttribute('type', 'text');
        valinput.setAttribute('id', 'query-val-' + position);
        valinput.setAttribute('size', '40');
        var span = document.createElement('span');
        span.setAttribute('id', 'query-data-' + position);
        span.appendChild(keyinput);
        span.appendChild(document.createTextNode(' : '));
        span.appendChild(valinput);
        span.appendChild(document.createElement('br'));

        var dataContainer = document.getElementById('req-data');
        dataContainer.appendChild(span);
    };
    QueryView.prototype.DeleteQuery=function(position)          {"use strict";
        var targetId = 'query-data-' + position;
        var target = document.getElementById(targetId);
        if (target === null) {
            console.log('Target node ' + targetId + ' is null!');
        }
        var parent = target.parentNode;
        parent.removeChild(target);
    };
    QueryView.prototype.LoadModel=function(position)                       {"use strict";
        var keyElem = document.getElementById('query-key-' + position);
        var valElem = document.getElementById('query-val-' + position);
        if (keyElem === null || valElem === null) {
            console.log('Target input (pos: ' + position + ') is null!');
        }
        var model = new QueryModel();
        model.Set(keyElem.value, valElem.value);
        return model;
    };
    QueryView.prototype.GetBaseURL=function()          {"use strict";
        var elem = document.getElementById('req-baseurl');
        return elem.value;
    };
    QueryView.prototype.GetEntryPoint=function()          {"use strict";
        var elem = document.getElementById('req-entrypoint');
        return elem.value;
    };
    QueryView.prototype.GetMethod=function()          {"use strict";
        var elems = document.getElementsByName('req-method');
        for (var i = 0; i < elems.length; i++) {
            if (elems[i].checked === true) {
                return elems[i].value;
            }
        }
        return "GET";
    };
    QueryView.prototype.RefreshResult=function() {"use strict";
        var responsesContainer = document.getElementById('req-response');
        responsesContainer.innerHTML = '';
    };
    QueryView.prototype.AppendProgress=function(message         , cssClass)          {"use strict";
        var container = document.createElement('div');
        container.setAttribute('class', cssClass);
        container.appendChild(document.createTextNode(message));
        var responsesContainer = document.getElementById('req-response');
        responsesContainer.appendChild(container);
    };
    QueryView.prototype.AppendResult=function(query                       , statusCode         , result)          {"use strict";
        var querystr          = "{";
        for(var i=0; i < query.length; i++) {
            querystr += query[i][0] + ' : "' + query[i][1].toString() + '"';
            if (i !== query.length - 1) {
                querystr += ',\n';
            }
        }
        querystr += '}';
        this.AppendProgress("Data: " + querystr, "res-query");

        this.AppendProgress("StatusCode: " + statusCode, "res-statuscode");
        this.AppendProgress("ResponseBody: " + result, "res-body");
    };



                        
                     
    function QueryController() {"use strict";
        this.queryCount = 0;
        this.view = new QueryView();
    }
    QueryController.prototype.AddNewQuery=function() {"use strict";
        this.view.ShowQuery(this.queryCount);
        this.queryCount++;
    };
    QueryController.prototype.DeleteLastQuery=function() {"use strict";
        this.view.DeleteQuery(this.queryCount - 1);
        this.queryCount--;
    };
    QueryController.prototype.ResetQuery=function() {"use strict";
        while(this.queryCount > 0) {
            this.DeleteLastQuery();
        }
        this.AddNewQuery();
    };
    QueryController.prototype.SendQuery=function() {"use strict";
        var queryRaw = this.getQueries();
        var query = this.queriesToString(queryRaw);

        var method = this.view.GetMethod();
        var baseURL = this.view.GetBaseURL();
        var entrypoint = this.view.GetEntryPoint();
        var url = baseURL + entrypoint;

        var http = new XMLHttpRequest();

        var $QueryController_this = this;
        var callback = function() {
            if (http.readyState == 4) {
                var queryArr = $QueryController_this.queriesToArray(queryRaw);
                $QueryController_this.view.AppendResult(queryArr, http.status, http.responseText);
            }
        };

        if (method === "GET") {
            url = url + '?' + query;
        }
        http.open(method, url, true);
        http.onreadystatechange = callback;
        if (method === "POST") {
            http.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
            http.send(query);
        } else {

            http.send(null);
        }
        this.view.RefreshResult();
        this.view.AppendProgress("Requesting...", "res-start");
        this.view.AppendProgress("Target: " + url, "res-target");
    };
    QueryController.prototype.getQueries=function()                     {"use strict";
        var queries                     = [];
        for (var i = 0; i < this.queryCount; i++) {
            queries[i] = this.view.LoadModel(i);
        }
        return queries;
    };
    QueryController.prototype.queriesToObject=function(queries)                              {"use strict";
        var obj = {};
        for (var i = 0; i < queries.length; i++) {
            obj[queries[i].GetKey()] = queries[i].GetValue();
        }
        return obj;
    };
    QueryController.prototype.queriesToArray=function(queries)                                            {"use strict";
        var arr = [];
        for (var i = 0; i < queries.length; i++) {
            arr[i] = [queries[i].GetKey(), queries[i].GetValue()];
        }
        return arr;
    };
    QueryController.prototype.queriesToString=function(queries)                              {"use strict";
        var kvs = queries.map(function(q) {
            return q.GetKey() + '=' + encodeURIComponent(q.GetValue()).replace(/%20/g, '+');
        });
        var str = kvs.join('&');
        return str;
    };

