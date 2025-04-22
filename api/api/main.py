from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.forecaster import Spec, Forecast

app = FastAPI()
app.add_middleware(CORSMiddleware, 
                   allow_origins=['http://localhost:3000'], 
                   allow_credentials=True, 
                   allow_methods=['*'], 
                   allow_headers=['*'])
forecast = Forecast(cache_filepath='../cache/forecast-state.pickle')

@app.get('/forecast')
async def forecast_index():
    return forecast.random()

@app.get('/forecast/{specifier}')
async def forecast_data_for(specifier: str):
    spec = Spec.decode(specifier)
    _, y = Spec.to_series(spec, days=365, samples=365)
    return list(y)
