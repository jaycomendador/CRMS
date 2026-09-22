import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const LOGO = require("../../assets/crms-logo.png");

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  // Animation values
  const logoScale   = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale  = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity= useRef(new Animated.Value(0.8)).current;
  const ring2Scale  = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity= useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY       = useRef(new Animated.Value(20)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo pops in
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Pulse rings expand out
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1Scale, { toValue: 2.2, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring1Scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring1Opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
            Animated.timing(ring1Opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          ]),
        ]),
        { iterations: 3 }
      ).start();

      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(500),
            Animated.timing(ring2Scale, { toValue: 2.4, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring2Scale, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(500),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 1400, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
        ]),
        { iterations: 3 }
      ).start();

      // 3. Title fades up
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, duration: 500, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]).start();

      // 4. Progress bar fills over 2s
      Animated.timing(barWidth, {
        toValue: SCREEN_W * 0.6,
        duration: 2400,
        delay: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false, // width can't use native driver
      }).start(() => {
        // 5. Fade out whole screen, then call onFinish
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(onFinish);
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0c1e30" />

      {/* Ambient glow blob */}
      <View style={styles.glowBlob} />

      {/* Logo + rings */}
      <View style={styles.logoContainer}>
        {/* Pulse ring 2 (outer) */}
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
          ]}
        />
        {/* Pulse ring 1 (inner) */}
        <Animated.View
          style={[
            styles.ring,
            styles.ringInner,
            { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
          ]}
        />

        {/* Logo image */}
        <Animated.View
          style={[
            styles.logoCircle,
            { transform: [{ scale: logoScale }], opacity: logoOpacity },
          ]}
        >
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>
      </View>

      {/* App name + tagline */}
      <Animated.View
        style={[
          styles.textBlock,
          { opacity: textOpacity, transform: [{ translateY: textY }] },
        ]}
      >
        <Text style={styles.appName}>CRMS Faculty</Text>
        <Text style={styles.tagline}>Classroom &amp; Resource Management System</Text>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]} />
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>CRMS · Faculty Portal</Text>
    </Animated.View>
  );
}

const TEAL   = "#0d8c7a";
const TEAL2  = "#55d6c1";
const DARK   = "#0c1e30";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  glowBlob: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: TEAL + "18",
    top: SCREEN_H * 0.5 - 170,
    left: SCREEN_W * 0.5 - 170,
    // React Native doesn't support CSS blur — use opacity instead
    opacity: 0.7,
  },

  // Logo
  logoContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: TEAL2,
  },
  ringInner: {
    borderColor: TEAL,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  logo: {
    width: 78,
    height: 78,
  },

  // Text
  textBlock: {
    alignItems: "center",
    gap: 6,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 12,
    color: TEAL2,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: 24,
  },

  // Progress
  barTrack: {
    width: SCREEN_W * 0.6,
    height: 3,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: TEAL2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 36,
    fontSize: 10,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
