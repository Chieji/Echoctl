package com.pocketforge.shared.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class HomeScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        Column(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("PocketForge", style = MaterialTheme.typography.displayLarge)
            Spacer(modifier = Modifier.height(32.dp))
            Button(onClick = { navigator.push(TerminalScreen()) }) {
                Text("Terminal")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { navigator.push(EditorScreen()) }) {
                Text("Code Editor")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { navigator.push(GitScreen()) }) {
                Text("Git")
            }
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { navigator.push(DeployScreen()) }) {
                Text("Deploy")
            }
        }
    }
}