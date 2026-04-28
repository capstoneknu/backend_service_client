# backend_service_client
PostgreSQL (RDB) - MSA 백엔드 API (Spring Boot/Node.js 기반 Mission/Reward Svc) - 결제 트랜잭션 - React Native 앱

-----------------------------------------------------------------------------------------------------------------

파일 배치 

├── App.js                         
├── store\
│   ├── store.js                    
│   └── authStore.js               
├── components\
│   └── Modals.js                  
├── screens\
│   ├── LoginScreen.js              
│   ├── SignUpScreen.js             
│   ├── SignUpCompleteScreen.js      
│   ├── HomeScreen.js                
│   ├── DREventScreen.js                
│   ├── MissionScreen.js  
│   ├── PointScreen.js
│   └── MyPageScreen.js  


src/main/java/com/energy/api/
├── config/
│   ├── JwtAuthenticationFilter.java  
│   └── DataInitializer.java         
├── controller/
│   └── EnergyController.java          
├── dto/
│   └── AuthDto.java                  
├── entity/
│   ├── EnergyData.java                
│   ├── DREvent.java                   
│   ├── DRParticipation.java          
│   ├── Mission.java                 
│   ├── MissionProgress.java         
│   └── PointHistory.java           
├── repository/
│   ├── UserRepository.java          
│   ├── EnergyDataRepository.java     
│   ├── DREventRepository.java        
│   ├── DRParticipationRepository.java 
│   ├── MissionRepository.java       
│   ├── MissionProgressRepository.java
│   └── PointHistoryRepository.java   
└── service/
    ├── EnergyService.java           
    ├── DREventService.java           
    ├── MissionService.java          
    └── PointService.java           
