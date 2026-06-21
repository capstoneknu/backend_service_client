package com.energy.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiMissionResponse {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("predicted_cbl_kwh")
    private Double predictedCblKwh;

    @JsonProperty("mission_target_kwh")
    private Double missionTargetKwh;

    @JsonProperty("curtailment_ratio_percent")
    private Double curtailmentRatioPercent;

    @JsonProperty("expected_reward_points")
    private Integer expectedRewardPoints;

    @JsonProperty("difficulty")
    private String difficulty;

    //XAI 추론 로그
    @JsonProperty("explainability_log")
    private String explainabilityLog; 
}