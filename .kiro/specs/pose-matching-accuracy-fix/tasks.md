# Implementation Plan

- [x] 1. Add diagnostic logging to understand coordinate space


  - Add console.log statements in `centerScale` function to log the scale factor, hip midpoint, and sample keypoint coordinates before and after transformation
  - Add console.log statements in `regionDistanceAccuracy` to log individual keypoint distances and the mean distance
  - Add console.log in `computeAlignedPoseAccuracy` to log the final accuracy metrics
  - Test with real poses to understand the typical distance values in the normalized space
  - _Requirements: 1.1, 1.2, 4.1, 4.3_

- [x] 2. Adjust maxD threshold in regionDistanceAccuracy



  - Based on logged distance values, determine an appropriate maxD threshold (likely between 0.3 and 0.5)
  - Update the `maxD` constant in `regionDistanceAccuracy` function in `src/utils/poseAccuracy.ts`
  - Add a code comment explaining why this threshold value was chosen
  - _Requirements: 1.2, 1.3, 4.3, 4.4, 4.5_

- [ ] 3. Test accuracy calculation with sample poses
  - Create a test scenario with identical poses (should return ~100% accuracy)
  - Create a test scenario with slightly different poses (should return 70-90% accuracy)
  - Create a test scenario with very different poses (should return <50% accuracy)
  - Verify that the accuracy scores are reasonable and reflect the actual similarity
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 4. Validate edge cases and error handling
  - Test with null poses and verify 0% accuracy is returned
  - Test with poses missing required keypoints for normalization
  - Test with keypoints having low confidence scores (<0.3)
  - Test with invalid scale factors (non-finite or very small values)
  - Verify that all edge cases are handled gracefully without crashes
  - _Requirements: 1.4, 2.3, 3.3, 3.4, 4.2_

- [ ] 5. Test real-time accuracy updates in the UI
  - Enable webcam and capture a trainer pose
  - Perform an exercise with good form and verify accuracy score updates above 0%
  - Perform the exercise with intentionally poor form and verify accuracy decreases
  - Verify that upper body, lower body, and core scores update independently
  - Test with different exercises (plank, squat, pushup) to ensure accuracy works for all
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.4_

- [ ] 6. Remove diagnostic logging and finalize code
  - Remove all console.log statements added for debugging
  - Ensure code comments explain the threshold choice and normalization approach
  - Verify code formatting and style consistency
  - _Requirements: 1.1, 1.2, 4.4_
