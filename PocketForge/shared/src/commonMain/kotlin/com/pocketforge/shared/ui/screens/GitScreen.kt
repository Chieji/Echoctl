package com.pocketforge.shared.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen

class GitScreen : Screen {
    @Composable
    override fun Content() {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            Text("Git Integration", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { /* GitHub API calls */ }) {
                Text("Fork Repo")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { /* GitHub API calls */ }) {
                Text("Create PR")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Button(onClick = { /* GitHub API calls */ }) {
                Text("Commit Changes")
            }
        }
    }
}