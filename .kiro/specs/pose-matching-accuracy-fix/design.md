# Design Document

## Overview

The pose matching accuracy calculation is currently returning 0% scores due to issues in the normalization and distance calculation logic in `computeAlignedPoseAccuracy`. The root cause is that the `maxD` threshold (1.0) used in the distance-to-accuracy conversion is too large for the normalized coordinate space after the `centerScale` transformation. This causes the mean distance to always be much smaller than the threshold, resulting in accuracy scores that round to 0%.

The fix involves adjusting the distance threshold to be appropriate for the normalized coordinate space and ensuring the accuracy calculation properly reflects the similarity between poses.

## Architecture

### Current Flow
1. User pose detected from webcam → normalized to 0-1 coordinates
2. Reference pose captured from trainer video → normalized to 0-1 coordinates
3. Both poses passed to `computeAlignedPoseAccuracy`
4. Poses are centered and scaled by `centerScale` function
5. Regional distances calculated using `regionDistanceAccuracy`
6. Angle differences calculated using `angleAccuracy`
7. Combined metrics returned to UI

### Problem Areas
- **centerScale normalization**: After centering by hip midpoint and scaling by torso width, the coordinate space changes significantly
- **maxD threshold**: The value of 1.0 is too large for the post-normalization coordinate space
- **Distance calculation**: The Euclidean distance between normalized keypoints needs a more appropriate threshold

## Components and Interfaces

### Modified Functions

#### 1. `regionDistanceAccuracy` (src/utils/poseAccuracy.ts)
```typescript
function regionDistanceAccuracy(a: Pose, b: Pose, indices: number[]): number
```

**Current Issues:**
- `maxD = 1.0` is too large for the normalized space
- After `centerScale`, typical distances between matching poses are in the range 0.01-0.3
- Using maxD=1.0 means even a distance of 0.2 gives 80% accuracy, but the formula rounds down

**Proposed Changes:**
- Adjust `maxD` to a more appropriate value (e.g., 0.5 or 0.4)
- This will make the accuracy more sensitive to actual pose differences
- Better differentiation between good and poor form

#### 2. `centerScale` (src/utils/poseAccuracy.ts)
```typescript
function centerScale(p: Pose): Pose
```

**Current Behavior:**
- Centers pose by hip midpoint
- Scales by average of shoulder width and hip width
- Returns original pose if required keypoints missing

**Validation Needed:**
- Ensure scale factor calculation is correct
- Verify that the normalization produces consistent results
- Add logging/debugging to understand the coordinate space

#### 3. `angleAccuracy` (src/utils/poseAccuracy.ts)
```typescript
function angleAccuracy(a: Pose, b: Pose): number
```

**Current Behavior:**
- Calculates joint angles for both poses
- Computes absolute difference for each joint
- Uses maxDiff=45 degrees as threshold

**Status:** This function appears correct and doesn't need changes

### Data Flow

```
User Webcam → detectPose() → Pose (pixel coords)
                                ↓
                          normalizePose() (0-1 coords)
                                ↓
                          setUserPose()
                                ↓
Trainer Video → captureTrainerPose() → Pose (pixel coords)
                                          ↓
                                    normalizePose() (0-1 coords)
                                          ↓
                                    setReferencePose()
                                          
userPose + referencePose → computeAlignedPoseAccuracy()
                                ↓
                          centerScale() (both poses)
                                ↓
                          regionDistanceAccuracy() (3 regions)
                                ↓
                          angleAccuracy()
                                ↓
                          Combined metrics → AccuracyMeter UI
```

## Data Models

### Pose Interface
```typescript
interface Pose {
  keypoints: Keypoint[];  // 17 keypoints (COCO format)
  score?: number;
}

interface Keypoint {
  x: number;  // After normalizePose: 0-1, After centerScale: centered/scaled
  y: number;  // After normalizePose: 0-1, After centerScale: centered/scaled
  score?: number;  // Confidence 0-1
  name?: string;
}
```

### AccuracyMetrics Interface
```typescript
interface AccuracyMetrics {
  overall: number;      // 0-100
  upperBody: number;    // 0-100
  lowerBody: number;    // 0-100
  core: number;         // 0-100
}
```

## Error Handling

### Edge Cases

1. **Missing Keypoints**
   - If required keypoints for normalization are missing, return original pose
   - Skip keypoints with confidence < 0.3 in distance calculations
   - Return 0% accuracy if no valid keypoints in a region

2. **Invalid Scale Factor**
   - If scale is non-finite or <= 1e-6, use scale = 1
   - Prevents division by zero or invalid transformations

3. **Null Poses**
   - If either userPose or referencePose is null, return all 0% metrics
   - Handled at the start of `computeAlignedPoseAccuracy`

4. **Angle Calculation Errors**
   - Wrapped in try-catch block
   - Returns 0% angle accuracy on error

## Testing Strategy

### Unit Tests
1. **Test centerScale normalization**
   - Verify poses are centered correctly
   - Verify scale factor calculation
   - Test with missing keypoints
   - Test with invalid scale factors

2. **Test regionDistanceAccuracy**
   - Test with identical poses (should return ~100%)
   - Test with slightly different poses (should return 70-90%)
   - Test with very different poses (should return <50%)
   - Test with missing keypoints
   - Test with low confidence keypoints

3. **Test computeAlignedPoseAccuracy**
   - Test with null poses
   - Test with identical poses
   - Test with poses at different scales
   - Test with poses at different positions
   - Verify regional scores are calculated correctly

### Integration Tests
1. **Test with real pose data**
   - Capture actual poses from webcam
   - Verify accuracy scores update in real-time
   - Test with different exercises (plank, squat, pushup)
   - Verify UI displays correct percentages

2. **Test pose matching workflow**
   - Capture trainer pose from video
   - Perform exercise and verify accuracy updates
   - Test with good form (should show >80%)
   - Test with poor form (should show <60%)

### Manual Testing Checklist
- [ ] Enable webcam and verify pose detection works
- [ ] Capture trainer pose from video or webcam
- [ ] Perform exercise with good form - verify accuracy > 0%
- [ ] Perform exercise with poor form - verify accuracy decreases
- [ ] Verify upper body, lower body, and core scores update independently
- [ ] Test with different exercises (plank, squat, pushup)
- [ ] Verify accuracy meter displays correct colors and animations
- [ ] Test with different camera distances and angles

## Implementation Approach

### Phase 1: Diagnosis and Logging
1. Add console logging to `centerScale` to understand coordinate space
2. Log distances in `regionDistanceAccuracy` before and after normalization
3. Verify the scale factor and centering calculations
4. Identify the appropriate maxD threshold value

### Phase 2: Fix Distance Threshold
1. Adjust `maxD` in `regionDistanceAccuracy` based on logged data
2. Test with sample poses to verify accuracy scores are reasonable
3. Ensure scores range from 0-100% appropriately

### Phase 3: Validation and Testing
1. Test with real webcam and trainer poses
2. Verify accuracy updates in real-time
3. Test edge cases (missing keypoints, null poses, etc.)
4. Validate regional scores are calculated correctly

### Phase 4: Cleanup
1. Remove debug logging
2. Add code comments explaining the threshold choice
3. Update any related documentation

## Alternative Approaches Considered

### Alternative 1: Use Pixel-Space Distance
- Calculate distance in original pixel coordinates instead of normalized space
- **Pros**: Simpler, no normalization needed
- **Cons**: Not scale-invariant, won't work with different camera distances

### Alternative 2: Use Only Angle-Based Accuracy
- Rely solely on joint angle differences, ignore keypoint positions
- **Pros**: More robust to position/scale differences
- **Cons**: Misses important spatial relationships, less comprehensive

### Alternative 3: Machine Learning Similarity Score
- Train a model to predict pose similarity
- **Pros**: Potentially more accurate, learns from data
- **Cons**: Requires training data, more complex, overkill for this use case

**Selected Approach**: Fix the distance threshold in the existing normalization approach because it's the simplest fix that addresses the root cause while maintaining the benefits of scale-invariant comparison.
