package com.energy.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class EnergyApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnergyApiApplication.class, args);
    }
}