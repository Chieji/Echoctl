plugins {
    kotlin("multiplatform")
    kotlin("native.cocoapods")
    kotlin("plugin.serialization")
    id("com.android.library")
    id("org.jetbrains.compose")
    id("org.jetbrains.kotlin.plugin.compose")
}

kotlin {
    android()
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    jvm("desktop")

    cocoapods {
        summary = "Shared code for PocketForge"
        homepage = "https://github.com/yourorg/PocketForge"
        ios.deploymentTarget = "14.1"
        framework {
            baseName = "Shared"
            isStatic = true
        }
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(compose.runtime)
                implementation(compose.foundation)
                implementation(compose.material3)
                @OptIn(org.jetbrains.compose.ExperimentalComposeLibrary::class)
                implementation(compose.components.resources)
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
                implementation("io.ktor:ktor-client-core:2.3.8")
                implementation("io.ktor:ktor-client-websockets:2.3.8")
                implementation("io.ktor:ktor-client-content-negotiation:2.3.8")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.8")
                implementation("cafe.adriel.voyager:voyager-navigator:1.0.0-rc05")
                implementation("cafe.adriel.voyager:voyager-screenmodel:1.0.0-rc05")
                implementation("cafe.adriel.voyager:voyager-tab-navigator:1.0.0-rc05")
            }
        }
        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-android:2.3.8")
                implementation("io.ktor:ktor-client-okhttp:2.3.8")
                implementation("io.ktor:ktor-client-websockets:2.3.8")
            }
        }
        val iosMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-ios:2.3.8")
                implementation("io.ktor:ktor-client-darwin:2.3.8")
                implementation("io.ktor:ktor-client-websockets:2.3.8")
            }
        }
        val desktopMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-java:2.3.8")
                implementation("io.ktor:ktor-client-websockets:2.3.8")
            }
        }
    }
}

android {
    namespace = "com.pocketforge.shared"
    compileSdk = 34
    defaultConfig {
        minSdk = 24
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}