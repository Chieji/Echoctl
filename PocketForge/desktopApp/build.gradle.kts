plugins {
    kotlin("jvm")
    id("org.jetbrains.compose")
    id("org.jetbrains.kotlin.plugin.compose")
    id("application")
}

application {
    mainClass.set("MainKt")
}

dependencies {
    implementation(project(":shared"))
    implementation(compose.desktop.currentOs)
}