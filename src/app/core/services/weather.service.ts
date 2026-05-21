import { Injectable, computed, signal } from '@angular/core';
import { WeatherCondition } from '../interfaces/weather-condition.interface';
import { DayForecast } from '../interfaces/day-forecast.interface';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private currentWeather = signal<WeatherCondition>({
    name: 'Initializing',
    temp: 0,
    condition: 'Loading',
    humidity: 0,
    windSpeed: 0,
    windDir: 'N',
    windDeg: 0,
    visibility: 0,
    uvIndex: 0,
    aqi: 0,
    dewPoint: 0,
  });

  private weatherDatabase = this.initializeWeatherDatabase();

  readonly weather = computed(() => this.currentWeather());
  readonly forecast = computed(() => this.getForecast());
  readonly humidity = computed(() => this.currentWeather().humidity);
  readonly windSpeed = computed(() => this.currentWeather().windSpeed);
  readonly windDir = computed(() => this.currentWeather().windDir);
  readonly windDeg = computed(() => this.currentWeather().windDeg);
  readonly visibility = computed(() => this.currentWeather().visibility);
  readonly uvIndex = computed(() => this.currentWeather().uvIndex);
  readonly aqi = computed(() => this.currentWeather().aqi);
  readonly dewPoint = computed(() => this.currentWeather().dewPoint);
  readonly temp = computed(() => this.currentWeather().temp);
  readonly condition = computed(() => this.currentWeather().condition);

  constructor() {
    this.selectTodayWeather();
  }

  private initializeWeatherDatabase(): Record<number, WeatherCondition[]> {
    // Simplified weather database - in production, this would load from JSON
    const db: Record<number, WeatherCondition[]> = {};

    for (let month = 0; month < 12; month++) {
      db[month] = [
        {
          name: 'Clear',
          temp: 15 + Math.random() * 10,
          condition: 'Clear',
          humidity: 50 + Math.random() * 20,
          windSpeed: 10 + Math.random() * 10,
          windDir: this.getWindDirection(45),
          windDeg: 45,
          visibility: 20 + Math.random() * 5,
          uvIndex: Math.floor(Math.random() * 11),
          aqi: 40 + Math.random() * 40,
          dewPoint: 5 + Math.random() * 10,
        },
        {
          name: 'Cloudy',
          temp: 12 + Math.random() * 10,
          condition: 'Overcast',
          humidity: 60 + Math.random() * 20,
          windSpeed: 8 + Math.random() * 12,
          windDir: this.getWindDirection(90),
          windDeg: 90,
          visibility: 15 + Math.random() * 10,
          uvIndex: Math.floor(Math.random() * 6),
          aqi: 50 + Math.random() * 30,
          dewPoint: 8 + Math.random() * 8,
        },
        {
          name: 'Rainy',
          temp: 10 + Math.random() * 8,
          condition: 'Rain',
          humidity: 75 + Math.random() * 15,
          windSpeed: 15 + Math.random() * 15,
          windDir: this.getWindDirection(180),
          windDeg: 180,
          visibility: 8 + Math.random() * 8,
          uvIndex: 0,
          aqi: 60 + Math.random() * 30,
          dewPoint: 10 + Math.random() * 5,
        },
        {
          name: 'Stormy',
          temp: 8 + Math.random() * 6,
          condition: 'Thunderstorm',
          humidity: 80 + Math.random() * 15,
          windSpeed: 25 + Math.random() * 20,
          windDir: this.getWindDirection(270),
          windDeg: 270,
          visibility: 3 + Math.random() * 5,
          uvIndex: 0,
          aqi: 80 + Math.random() * 20,
          dewPoint: 12 + Math.random() * 5,
        },
        {
          name: 'Sunny',
          temp: 18 + Math.random() * 12,
          condition: 'Sunny',
          humidity: 40 + Math.random() * 15,
          windSpeed: 5 + Math.random() * 8,
          windDir: this.getWindDirection(315),
          windDeg: 315,
          visibility: 22 + Math.random() * 3,
          uvIndex: Math.floor(7 + Math.random() * 4),
          aqi: 35 + Math.random() * 25,
          dewPoint: 3 + Math.random() * 8,
        },
        {
          name: 'Hazy',
          temp: 16 + Math.random() * 10,
          condition: 'Haze',
          humidity: 55 + Math.random() * 20,
          windSpeed: 6 + Math.random() * 8,
          windDir: this.getWindDirection(0),
          windDeg: 0,
          visibility: 10 + Math.random() * 10,
          uvIndex: Math.floor(4 + Math.random() * 4),
          aqi: 65 + Math.random() * 30,
          dewPoint: 8 + Math.random() * 8,
        },
        {
          name: 'Windy',
          temp: 13 + Math.random() * 9,
          condition: 'Windy',
          humidity: 50 + Math.random() * 25,
          windSpeed: 20 + Math.random() * 18,
          windDir: this.getWindDirection(135),
          windDeg: 135,
          visibility: 12 + Math.random() * 10,
          uvIndex: Math.floor(2 + Math.random() * 5),
          aqi: 45 + Math.random() * 35,
          dewPoint: 6 + Math.random() * 9,
        },
        {
          name: 'Foggy',
          temp: 8 + Math.random() * 6,
          condition: 'Fog',
          humidity: 85 + Math.random() * 10,
          windSpeed: 2 + Math.random() * 6,
          windDir: this.getWindDirection(225),
          windDeg: 225,
          visibility: 1 + Math.random() * 3,
          uvIndex: 0,
          aqi: 70 + Math.random() * 25,
          dewPoint: 7 + Math.random() * 3,
        },
        {
          name: 'Drizzle',
          temp: 11 + Math.random() * 7,
          condition: 'Drizzle',
          humidity: 70 + Math.random() * 18,
          windSpeed: 10 + Math.random() * 10,
          windDir: this.getWindDirection(30),
          windDeg: 30,
          visibility: 12 + Math.random() * 8,
          uvIndex: Math.floor(Math.random() * 3),
          aqi: 52 + Math.random() * 28,
          dewPoint: 9 + Math.random() * 6,
        },
        {
          name: 'Partly Cloudy',
          temp: 14 + Math.random() * 11,
          condition: 'Partly Cloudy',
          humidity: 52 + Math.random() * 18,
          windSpeed: 9 + Math.random() * 11,
          windDir: this.getWindDirection(120),
          windDeg: 120,
          visibility: 18 + Math.random() * 7,
          uvIndex: Math.floor(3 + Math.random() * 5),
          aqi: 42 + Math.random() * 28,
          dewPoint: 6 + Math.random() * 8,
        },
      ];
    }

    return db;
  }

  private selectTodayWeather(): void {
    const today = new Date();
    const month = today.getMonth();
    const dayIndex = Math.floor(Math.random() * 10); // Random profile from 10 available

    const monthProfiles =
      this.weatherDatabase[month] || this.weatherDatabase[0];
    const todayWeather = monthProfiles[dayIndex % monthProfiles.length];

    this.currentWeather.set(todayWeather);
  }

  private getForecast(): DayForecast[] {
    const forecast: DayForecast[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const month = forecastDate.getMonth();
      const dayIndex = (today.getDate() + i) % 10;

      const monthProfiles =
        this.weatherDatabase[month] || this.weatherDatabase[0];
      const weather = monthProfiles[dayIndex];

      forecast.push({
        date: new Date(forecastDate),
        temp: Math.round(weather.temp),
        condition: weather.condition,
        high: Math.round(weather.temp + 3),
        low: Math.round(weather.temp - 2),
        uvIndex: weather.uvIndex,
        aqi: Math.round(weather.aqi),
      });
    }

    return forecast;
  }

  private getWindDirection(degrees: number): string {
    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }
}
