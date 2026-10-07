# Requirements Document

## Introduction

The pose matching feature in the PoseMatch page is currently not evaluating the Euclidean distance between the user's pose and the YouTube trainer's pose correctly. The accuracy score remains stuck at 0% even when the user performs the exercise correctly. This feature needs to be fixed to provide real-time form accuracy feedback by properly computing the similarity between the user's pose and the reference pose from the trainer video.

## Requirements

### Requirement 1: Real-time Pose Accuracy Calculation

**User Story:** As a user performing an exercise, I want to see my real-time form accuracy score update as I match the trainer's pose, so that I can adjust my form and improve my technique.

#### Acceptance Criteria

1. WHEN a user's pose is detected AND a reference trainer pose exists THEN the system SHALL compute an accuracy score between 0-100% based on the Euclidean distance between normalized keypoints
2. WHEN the user's pose closely matches the trainer's pose THEN the overall accuracy score SHALL be greater than 0% and reflect the similarity
3. WHEN the user's pose differs significantly from the trainer's pose THEN the accuracy score SHALL decrease proportionally to the distance
4. WHEN either the user pose or reference pose is null THEN the system SHALL return 0% accuracy for all metrics

### Requirement 2: Accurate Body Region Scoring

**User Story:** As a user, I want to see separate accuracy scores for my upper body, lower body, and core, so that I can identify which specific areas of my form need improvement.

#### Acceptance Criteria

1. WHEN computing regional accuracy THEN the system SHALL calculate separate scores for upper body (keypoints 0-10), lower body (keypoints 11-16), and core (keypoints 5, 6, 11, 12)
2. WHEN a body region has valid keypoints with confidence > 0.3 THEN the system SHALL include those keypoints in the regional accuracy calculation
3. WHEN a body region has no valid keypoints THEN the system SHALL return 0% accuracy for that region
4. WHEN computing regional scores THEN the system SHALL combine both Euclidean distance accuracy (50%) and angle accuracy (50%)

### Requirement 3: Pose Normalization and Alignment

**User Story:** As a user standing at different distances from the camera, I want the pose matching to work regardless of my position or size in the frame, so that I can exercise comfortably without worrying about exact camera placement.

#### Acceptance Criteria

1. WHEN normalizing poses THEN the system SHALL center both poses by their hip midpoint (average of left and right hip positions)
2. WHEN normalizing poses THEN the system SHALL scale both poses by the average of shoulder width and hip width to make them size-invariant
3. WHEN the scale factor is invalid (non-finite or <= 1e-6) THEN the system SHALL use a scale factor of 1
4. WHEN keypoints are missing (left hip, right hip, left shoulder, or right shoulder) THEN the system SHALL return the original pose without normalization

### Requirement 4: Distance-Based Accuracy Computation

**User Story:** As a user, I want the accuracy calculation to properly evaluate how close my keypoints are to the trainer's keypoints, so that I receive accurate feedback on my form.

#### Acceptance Criteria

1. WHEN computing region distance accuracy THEN the system SHALL calculate the Euclidean distance for each valid keypoint pair in the region
2. WHEN a keypoint has a confidence score <= 0.3 THEN the system SHALL exclude that keypoint from the accuracy calculation
3. WHEN computing the mean distance THEN the system SHALL use a maximum distance threshold that is appropriate for normalized coordinates
4. WHEN converting distance to accuracy percentage THEN the system SHALL use the formula: accuracy = max(0, min(100, (1 - meanDistance / maxDistance) * 100))
5. WHEN the maximum distance threshold is too small THEN the system SHALL adjust it to prevent accuracy scores from being stuck at 0%

### Requirement 5: Angle-Based Accuracy Validation

**User Story:** As a user, I want the system to consider joint angles in addition to keypoint positions, so that my form is evaluated more comprehensively.

#### Acceptance Criteria

1. WHEN computing angle accuracy THEN the system SHALL calculate joint angles for both user and reference poses
2. WHEN comparing angles THEN the system SHALL compute the absolute difference for each joint (elbows, shoulders, hips, knees)
3. WHEN a joint angle is invalid (<= 0) THEN the system SHALL exclude that joint from the angle accuracy calculation
4. WHEN computing angle accuracy percentage THEN the system SHALL use a maximum angle difference of 45 degrees as the threshold
5. WHEN no valid joints exist THEN the system SHALL return 0% angle accuracy
