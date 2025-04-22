import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from random import uniform as rand
import random
import base64
import pickle
from pathlib import Path

class Spec:
    @staticmethod
    def random_base():
        return [(rand(0, 1), rand(0, 2), 50) for _ in range(0,3)] + [(rand(3, 6), rand(0, 2), 10) for _ in range(0,3)]
    
    @staticmethod
    def random(from_basespec):
        top_amp = rand(0.2, 5)
        top = [(rand(25, 150), rand(0, 0.5), top_amp) for _ in range(0,5)]
        mid = [(rand(6, 12), rand(0, 0.5), 5) for _ in range(0,5)]
        return (rand(0.5, 2), rand(0, 200), from_basespec + top + mid)
    
    @staticmethod
    def encode(spec):
        mult, floor, cycle_spec = spec
        data = np.array([mult, floor] + sum(map(lambda tup: list(tup), cycle_spec), []), np.float16).tobytes(order='C')
        return base64.urlsafe_b64encode(data).decode('utf-8') # about 136 chars; chrome / IE url length: 2,083

    @staticmethod
    def decode(encoded_spec):
        mult, floor, *remainder = np.frombuffer(base64.urlsafe_b64decode(encoded_spec), dtype=np.float16)
        cycle_spec=[]
        while len(remainder):
            cycles, offset, amplitude, *remainder = remainder
            cycle_spec.append((cycles, offset, amplitude))
        return (mult, floor, cycle_spec)

    @staticmethod
    def to_series(spec, days:int=365, samples:int|None=None):
        total_seconds = timedelta(days=days).total_seconds()
        x = np.linspace(0, total_seconds, total_seconds if samples is None else samples)
        multiplier, floor_val, params = spec
        y = np.zeros_like(x)
        for cycles, offset, amplitude in params:
            y = y + Spec._yearly_sin(x, total_seconds, cycles, offset, amplitude)
        return x, multiplier * (y + abs(y.min())) + floor_val

    def _yearly_sin(x, total_seconds, cycles_year, offset_year, amplitude ):
        return amplitude * np.sin(((x + offset_year * timedelta(days=365).total_seconds()) / total_seconds) * (np.pi * 2 * cycles_year))


class Forecast:   
    def __init__(self, cache_filepath=None):
        # cache location calculated relative to this source file, rather than pwd of shell
        resolved_path =  (Path(__file__).parent / Path(cache_filepath)).resolve() if cache_filepath else None
        self.company_types = 'ltd plc inc llp corp bv srl nv sa ag sarl'.split()
        # this is cached by pandas, no need to pickle
        self.flag_df = pd.read_csv('https://raw.githubusercontent.com/chrishinds/regional-indicator-symbols/refs/heads/main/regional-indicator-symbols.csv')
        if resolved_path:
            try:
                with open(resolved_path, 'rb') as f:
                    self.nouns, self.adjectives = pickle.load(f)
                return None
            except Exception as e:
                print(f'Failed to load state from {resolved_path}, regenerating...')
        self.nouns = Forecast.load_synset('n')
        self.adjectives = Forecast.load_synset('a')
        if resolved_path:
            with open(resolved_path, 'wb') as f:
                pickle.dump((self.nouns, self.adjectives), f)

    def random_company_name(self):
        return f'{random.choice(self.adjectives).capitalize()} {random.choice(self.nouns).capitalize()} {random.choice(self.company_types).upper()}'

    def random_countries(self, sample_size):
        return list(self.flag_df.sample(sample_size).itertuples(index=False, name=None))

    @staticmethod
    def load_synset(pos):
        import nltk
        words = sum([ss.lemma_names() for ss in nltk.corpus.wordnet.all_synsets(pos)], [])
        return [s for s in words if '-' not in s and '_' not in s and s.lower()==s]

    def random(self, countries_lower=3, countries_upper=12, companies_lower=5, companies_upper=25, day_count=365):
        end_date = datetime.now().replace(microsecond=0, second=0)
        start_date = end_date - timedelta(days=day_count)
        countries = []
        for country in self.random_countries(random.randint(countries_lower, countries_upper)):
            flag, _, country_name = country
            companies = []
            base_values = Spec.random_base()
            for _ in range(0, random.randint(companies_lower, companies_upper)):
                encoded = Spec.encode(Spec.random(base_values))
                companies.append(dict(name=self.random_company_name(), forecast_url=f'/forecast/{str(encoded)}'))
            countries.append(dict(flag=flag, name=country_name, companies=companies))
        end_date = datetime.now().replace(microsecond=0) 
        start_date = end_date - timedelta(days=365)
        return dict(end_date=end_date, start_date=start_date, countries=countries)

