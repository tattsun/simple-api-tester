/* @flow */
class QueryModel {
    key : string;
    val : string;
    constructor() {
        this.key = "";
        this.val = "";
    }
    Set(key : string, val : string) {
        this.key = key;
        this.val = val;
    }
    GetKey() : string {
        return this.key;
    }
    GetValue() : string {
        return this.val;
    }
}

class QueryView {
    ShowQuery(position : number) {
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
    }
    DeleteQuery(position : number) {
        var targetId = 'query-data-' + position;
        var target = document.getElementById(targetId);
        if (target === null) {
            console.log('Target node ' + targetId + ' is null!');
        }
        var parent = target.parentNode;
        parent.removeChild(target);
    }
    LoadModel(position : number) : QueryModel {
        var keyElem = document.getElementById('query-key-' + position);
        var valElem = document.getElementById('query-val-' + position);
        if (keyElem === null || valElem === null) {
            console.log('Target input (pos: ' + position + ') is null!');
        }
        var model = new QueryModel();
        model.Set(keyElem.value, valElem.value);
        return model;
    }
    GetBaseURL() : string {
        var elem = document.getElementById('req-baseurl');
        return elem.value;
    }
    GetEntryPoint() : string {
        var elem = document.getElementById('req-entrypoint');
        return elem.value;
    }
    GetMethod() : string {
        var elems = document.getElementsByName('req-method');
        for (var i = 0; i < elems.length; i++) {
            if (elems[i].checked === true) {
                return elems[i].value;
            }
        }
        return "GET";
    }
    RefreshResult() {
        var responsesContainer = document.getElementById('req-response');
        responsesContainer.innerHTML = '';
    }
    AppendProgress(message : string, cssClass : string) {
        var container = document.createElement('div');
        container.setAttribute('class', cssClass);
        container.appendChild(document.createTextNode(message));
        var responsesContainer = document.getElementById('req-response');
        responsesContainer.appendChild(container);
    }
    AppendResult(query : Array<Array<string>>, statusCode : number, result : string) {
        var querystr : string = "{";
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
    }
}

class QueryController {
    queryCount : number;
    view : QueryView;
    constructor() {
        this.queryCount = 0;
        this.view = new QueryView();
    }
    AddNewQuery() {
        this.view.ShowQuery(this.queryCount);
        this.queryCount++;
    }
    DeleteLastQuery() {
        this.view.DeleteQuery(this.queryCount - 1);
        this.queryCount--;
    }
    ResetQuery() {
        while(this.queryCount > 0) {
            this.DeleteLastQuery();
        }
        this.AddNewQuery();
    }
    SendQuery() {
        var queryRaw = this.getQueries();
        var query = this.queriesToString(queryRaw);

        var method = this.view.GetMethod();
        var baseURL = this.view.GetBaseURL();
        var entrypoint = this.view.GetEntryPoint();
        var url = baseURL + entrypoint;

        var http = new XMLHttpRequest();

        var _this = this;
        var callback = function() {
            if (http.readyState == 4) {
                var queryArr = _this.queriesToArray(queryRaw);
                _this.view.AppendResult(queryArr, http.status, http.responseText);
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
    }
    getQueries() : Array<QueryModel> {
        var queries : Array<QueryModel> = [];
        for (var i = 0; i < this.queryCount; i++) {
            queries[i] = this.view.LoadModel(i);
        }
        return queries;
    }
    queriesToObject(queries : Array<QueryModel>) : Object {
        var obj = {};
        for (var i = 0; i < queries.length; i++) {
            obj[queries[i].GetKey()] = queries[i].GetValue();
        }
        return obj;
    }
    queriesToArray(queries : Array<QueryModel>) : Array<Array<string>> {
        var arr = [];
        for (var i = 0; i < queries.length; i++) {
            arr[i] = [queries[i].GetKey(), queries[i].GetValue()];
        }
        return arr;
    }
    queriesToString(queries : Array<QueryModel>) : string {
        var kvs = queries.map(function(q) {
            return q.GetKey() + '=' + encodeURIComponent(q.GetValue()).replace(/%20/g, '+');
        });
        var str = kvs.join('&');
        return str;
    }
}
