import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, html, dcc
from dash.dependencies import Input, Output
import pandas as pd
import json

app = Dash(__name__)

with open('out.json', 'r') as f:
    df = pd.DataFrame([ {
        "price": obj["price_1k"] * 1000,
        "size": obj["size"],
        "rooms": obj["rooms"],
        "url": obj["url"],
        "loc": obj["loc"].split(',')[0],
        "clicked": False
    } for obj in [json.loads(line) for line in f.readlines()]]).drop_duplicates()

fig = px.scatter(df, x="size", y="price", color="loc", symbol="clicked", hover_data=['url'])
locations = df['loc'].unique()

app.layout = html.Div([
    html.H1(children='Housing Prices in DK'),

    dcc.Graph(
        id='housing-graph',
        figure=fig
    ),

    dcc.Dropdown(locations, multi=True, id="selector"),

    html.Div([
        html.H2("Last clicked"),
        html.A("Go to listing", id="goto-button", href="") ,
        html.Div(id="clicked-output")
    ])
])

@app.callback(
    Output("clicked-output", "children"),
    Input("housing-graph", "clickData"))
def display_click(clickData):
    url = clickData['points'][0]['customdata'][0]
    index = df[df["url"] == url].index.values[0]
    df.at[index, 'clicked'] = True

    return json.dumps(clickData, indent=2)

@app.callback(
    Output("goto-button", component_property="href"),
    Input("housing-graph", "clickData"))
def goto_click(clickData):
    url = clickData['points'][0]['customdata'][0]
    return url
    

@app.callback(
    Output("housing-graph", "figure"),
    Input("selector", "value")
)
def filter_graph(selectorValues):
    
    return px.scatter(df[df["loc"].isin(selectorValues or locations)], x="size", y="price", symbol="clicked", color="loc", hover_data=['url'])


if __name__ == '__main__':
    app.run_server(debug=True)
    

    